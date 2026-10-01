import { expect, test } from '@playwright/test'
import type { Page, Route } from '@playwright/test'

const user = { id: 1, email: 'member@example.test', fullName: 'Nguyễn An', phone: null, role: 'CUSTOMER' }
const password = 'Test-password-123'

async function anonymous(page: Page) {
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 401, json: { code: 'UNAUTHORIZED' } }))
}

function checkRequest(route: Route) {
  expect(route.request().method()).toBe('POST')
  expect(route.request().headers()['x-csrf-protection']).toBe('1')
}

async function fillLogin(page: Page) {
  await page.getByLabel('Email', { exact: false }).fill(user.email)
  await page.locator('input[name="password"]').fill(password)
}

async function fillRegistration(page: Page) {
  await page.getByLabel('Họ và tên', { exact: false }).fill('  Nguyễn An  ')
  await page.getByLabel('Email', { exact: false }).fill('MEMBER@example.test')
  await page.locator('input[name="password"]').fill(password)
  await page.locator('input[name="confirmPassword"]').fill(password)
}

test('anonymous visitors are redirected and login only contains email/password', async ({ page }) => {
  await anonymous(page)
  await page.goto('/')
  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible()
  await expect(page.locator('form input')).toHaveCount(2)
  await expect(page.getByText(/Hoặc đăng nhập nhanh|Mô phỏng kiểm thử|Quên mật khẩu/i)).toHaveCount(0)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click()
  await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Ẩn mật khẩu', exact: true }).click()
  await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: test.info().outputPath('login.png'), fullPage: true })
})

for (const role of ['CUSTOMER', 'ORGANIZER']) {
  test(`registration sends ${role} and returns to login without signing in`, async ({ page }) => {
    await anonymous(page)
    let registrations = 0
    await page.route('**/api/auth/register', async (route) => {
      checkRequest(route)
      expect(route.request().postDataJSON()).toEqual({ email: user.email, fullName: user.fullName, phone: null, password, role })
      registrations++
      await route.fulfill({ status: 201, contentType: 'text/plain', body: 'Registration successful' })
    })
    await page.goto('/register')
    await fillRegistration(page)
    if (role === 'ORGANIZER') await page.getByRole('radio', { name: /Ban tổ chức/ }).check()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.screenshot({ path: test.info().outputPath('register.png'), fullPage: true })
    await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('status')).toContainText('Đăng ký thành công')
    expect(registrations).toBe(1)
    await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toHaveCount(0)
  })
}

test('mismatch and multibyte password limits prevent registration requests', async ({ page }) => {
  await anonymous(page)
  let registrations = 0
  await page.route('**/api/auth/register', (route) => { registrations++; return route.fulfill({ status: 500 }) })
  await page.goto('/register')
  await fillRegistration(page)
  await page.locator('input[name="confirmPassword"]').fill('different-password')
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
  await expect(page.getByText('Mật khẩu xác nhận chưa khớp.')).toBeVisible()
  const longPassword = 'ệ'.repeat(25)
  await page.locator('input[name="password"]').fill(longPassword)
  await page.locator('input[name="confirmPassword"]').fill(longPassword)
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
  await expect(page.getByText(/Mật khẩu không được vượt quá 72 byte/)).toBeVisible()
  expect(registrations).toBe(0)
})

test('duplicate email is shown without redirecting or losing form values', async ({ page }) => {
  await anonymous(page)
  await page.route('**/api/auth/register', (route) => route.fulfill({ status: 409, json: { code: 'REQUEST_ERROR' } }))
  await page.goto('/register')
  await fillRegistration(page)
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Email này đã được đăng ký')
  await expect(page).toHaveURL('/register')
  await expect(page.locator('input[name="email"]')).toHaveValue('MEMBER@example.test')
  await expect(page.getByRole('button', { name: 'Đăng ký', exact: true })).toBeEnabled()
})

test('login, reload with HttpOnly cookie, and logout use the backend contract', async ({ page, context }) => {
  let refreshCalls = 0
  let logouts = 0
  await page.route('**/api/auth/refresh', async (route) => {
    checkRequest(route)
    refreshCalls++
    if (route.request().headers().cookie?.includes('refresh_token=test-session')) {
      await route.fulfill({ status: 200, json: user })
    } else {
      await route.fulfill({ status: 401, json: {} })
    }
  })
  await page.route('**/api/auth/login', async (route) => {
    checkRequest(route)
    expect(route.request().postDataJSON()).toEqual({ email: user.email, password })
    await route.fulfill({ status: 200, json: user,
      headers: { 'Set-Cookie': 'refresh_token=test-session; Path=/api/auth; HttpOnly; SameSite=Lax' } })
  })
  await page.route('**/api/auth/logout', async (route) => {
    checkRequest(route)
    expect(route.request().headers().cookie).toContain('refresh_token=test-session')
    logouts++
    await route.fulfill({ status: 204,
      headers: { 'Set-Cookie': 'refresh_token=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Lax' } })
  })
  await page.goto('/login')
  await fillLogin(page)
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page).toHaveURL('/')
  await expect(page.locator('body')).toHaveText('Đăng xuất')
  expect(await page.evaluate(() => localStorage.length)).toBe(0)
  expect(await page.evaluate(() => document.cookie)).not.toContain('refresh_token')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeVisible()
  expect(refreshCalls).toBe(2)
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
  await expect(page).toHaveURL('/login')
  expect(logouts).toBe(1)
  expect((await context.cookies()).some((cookie) => cookie.name === 'refresh_token')).toBe(false)
  await page.goto('/')
  await expect(page).toHaveURL('/login')
})

test('wrong credentials and network errors remain recoverable', async ({ page }) => {
  await anonymous(page)
  await page.route('**/api/auth/login', (route) => route.fulfill({ status: 401, json: {} }))
  await page.goto('/login')
  await fillLogin(page)
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Email hoặc mật khẩu không đúng')
  await page.route('**/api/auth/login', (route) => route.abort())
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Không thể kết nối')
  await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeEnabled()
})

test('failed logout keeps the session and allows retry', async ({ page }) => {
  await page.route('**/api/auth/refresh', (route) => route.fulfill({ status: 200, json: user }))
  await page.route('**/api/auth/logout', (route) => route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('alert')).toContainText('Không thể kết nối')
  await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeEnabled()
  await page.route('**/api/auth/logout', (route) => route.fulfill({ status: 204 }))
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
  await expect(page).toHaveURL('/login')
})
