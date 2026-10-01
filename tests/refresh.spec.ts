import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const user = {
  id: 1,
  email: 'member@example.test',
  fullName: 'Nguyễn An',
  phone: null,
  role: 'CUSTOMER',
}

type ClientModule = {
  httpClient: {
    post: (
      url: string,
      body: unknown,
      config?: { headers: Record<string, string> },
    ) => Promise<{ data: unknown }>
  }
}

// The current home has no business API. Exercise the actual Axios client through
// Vite's module URL and mock a protected endpoint, without adding a test UI.
async function requestProtected(page: Page, count = 1) {
  return page.evaluate(async (count) => {
    const modulePath = '/src/lib/http-client.ts'
    const { httpClient } = (await import(modulePath)) as ClientModule
    return Promise.all(
      Array.from({ length: count }, (_, index) =>
        httpClient
          .post('/test/protected', { index }, { headers: { 'X-Test-Request': String(index) } })
          .then(({ data }) => ({ ok: true, data, status: 200 }))
          .catch((error: unknown) => ({
            ok: false,
            data: null,
            status: error && typeof error === 'object' && 'status' in error ? error.status : 0,
          })),
      ),
    )
  }, count)
}

test('concurrent and late 401 responses share one refresh and replay original requests', async ({
  page,
}) => {
  let refreshCalls = 0
  const attempts = new Map<number, number>()
  let firstWaveReady!: () => void
  const firstWave = new Promise<void>((resolve) => {
    firstWaveReady = resolve
  })
  let retryReady!: () => void
  const retryStarted = new Promise<void>((resolve) => {
    retryReady = resolve
  })
  await page.route('**/api/auth/refresh', async (route) => {
    refreshCalls++
    expect(route.request().headers()['x-csrf-protection']).toBe('1')
    if (refreshCalls > 1) await firstWave
    await route.fulfill({ status: 200, json: user })
  })
  await page.route('**/api/test/protected', async (route) => {
    const { index } = route.request().postDataJSON() as { index: number }
    const attempt = (attempts.get(index) ?? 0) + 1
    attempts.set(index, attempt)
    expect(route.request().method()).toBe('POST')
    expect(route.request().headers()['x-csrf-protection']).toBe('1')
    expect(route.request().headers()['x-test-request']).toBe(String(index))
    if (attempt === 1) {
      if (attempts.size === 3) firstWaveReady()
      if (index === 2) await retryStarted
      await route.fulfill({ status: 401, json: {} })
    } else {
      retryReady()
      await route.fulfill({ status: 200, json: { index } })
    }
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeVisible()
  expect(await requestProtected(page, 3)).toEqual(
    [0, 1, 2].map((index) => ({ ok: true, data: { index }, status: 200 })),
  )
  expect(refreshCalls).toBe(2) // One bootstrap refresh, one recovery refresh.
  expect([...attempts.values()]).toEqual([2, 2, 2])
  await expect(page).toHaveURL('/')
})

test('expired refresh clears the session, redirects to login, and permits a new login', async ({
  page,
}) => {
  let refreshCalls = 0
  let protectedCalls = 0
  await page.route('**/api/auth/refresh', (route) => {
    refreshCalls++
    return route.fulfill({
      status: refreshCalls === 1 ? 200 : 401,
      json: refreshCalls === 1 ? user : {},
    })
  })
  await page.route('**/api/test/protected', (route) => {
    protectedCalls++
    return route.fulfill({ status: 401, json: {} })
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeVisible()
  const results = await requestProtected(page, 3)
  expect(results.every((result) => !result.ok && result.status === 401)).toBe(true)
  expect(refreshCalls).toBe(2)
  expect(protectedCalls).toBe(3)
  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('alert')).toContainText('Phiên đăng nhập đã hết hạn')
  await page.route('**/api/auth/login', (route) => route.fulfill({ status: 200, json: user }))
  await page.getByLabel('Email', { exact: false }).fill(user.email)
  await page.locator('input[name="password"]').fill('Test-password-123')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page).toHaveURL('/')
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 200, json: user }))
  let newAttempts = 0
  await page.route('**/api/test/protected', (route) => {
    newAttempts++
    return route.fulfill({ status: newAttempts === 1 ? 401 : 200, json: { recovered: true } })
  })
  expect((await requestProtected(page))[0].ok).toBe(true)
  expect(newAttempts).toBe(2)
})

test('401 after retry ends the session without a refresh loop', async ({ page }) => {
  let refreshCalls = 0
  let attempts = 0
  await page.route('**/api/auth/refresh', (route) => {
    refreshCalls++
    return route.fulfill({ status: 200, json: user })
  })
  await page.route('**/api/test/protected', (route) => {
    attempts++
    return route.fulfill({ status: 401, json: {} })
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeVisible()
  expect((await requestProtected(page))[0].status).toBe(401)
  await expect(page).toHaveURL('/login')
  expect(refreshCalls).toBe(2)
  expect(attempts).toBe(2)
})

test('403 is not treated as token expiry', async ({ page }) => {
  let refreshCalls = 0
  await page.route('**/api/auth/refresh', (route) => {
    refreshCalls++
    return route.fulfill({ status: 200, json: user })
  })
  await page.route('**/api/test/protected', (route) => route.fulfill({ status: 403, json: {} }))
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeVisible()
  expect((await requestProtected(page))[0].status).toBe(403)
  expect(refreshCalls).toBe(1)
  await expect(page).toHaveURL('/')
})

for (const failure of ['network', 'server']) {
  test(`refresh ${failure} failure preserves session and allows later recovery`, async ({
    page,
  }) => {
    let refreshCalls = 0
    await page.route('**/api/auth/refresh', (route) => {
      refreshCalls++
      if (refreshCalls === 2)
        return failure === 'network' ? route.abort() : route.fulfill({ status: 503, json: {} })
      return route.fulfill({ status: 200, json: user })
    })
    await page.route('**/api/test/protected', (route) =>
      route.fulfill({ status: refreshCalls >= 3 ? 200 : 401, json: {} }),
    )
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeVisible()
    expect((await requestProtected(page))[0].ok).toBe(false)
    await expect(page).toHaveURL('/')
    expect((await requestProtected(page))[0].ok).toBe(true)
    expect(refreshCalls).toBe(3)
  })
}

test('invalid login never triggers another refresh', async ({ page }) => {
  let refreshCalls = 0
  await page.route('**/api/auth/refresh', (route) => {
    refreshCalls++
    return route.fulfill({ status: 401, json: {} })
  })
  await page.route('**/api/auth/login', (route) => route.fulfill({ status: 401, json: {} }))
  await page.goto('/login')
  await page.getByLabel('Email', { exact: false }).fill(user.email)
  await page.locator('input[name="password"]').fill('Wrong-password-123')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Email hoặc mật khẩu không đúng')
  expect(refreshCalls).toBe(1)
})
