import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

type Item = { id: number; title: string; content: string; type: string; createdAt: string; read: boolean }
const paths = { ADMIN: '/admin/notifications', ORGANIZER: '/organizer/notifications', CUSTOMER: '/customer/thong-bao' }

async function setup(page: Page, role: keyof typeof paths | 'STAFF') {
  const state = {
    items: [item(2), item(1)],
    failList: false,
    signedIn: true,
  }
  await page.addInitScript(() => {
    const streams: EventSource[] = []
    Object.defineProperty(window, 'notificationStreams', { value: streams })
    class FakeEventSource extends EventTarget {
      readyState = 1
      onopen: ((event: Event) => void) | null = null
      onerror: ((event: Event) => void) | null = null
      constructor(public url: string, public options?: EventSourceInit) {
        super()
        streams.push(this as unknown as EventSource)
        queueMicrotask(() => { if (this.readyState !== 2) this.onopen?.(new Event('open')) })
      }
      close() { this.readyState = 2 }
    }
    window.EventSource = FakeEventSource as unknown as typeof EventSource
  })
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path.endsWith('/auth/refresh')) return route.fulfill({ status: state.signedIn ? 200 : 401, json: { id: 1, role, fullName: 'Nguyễn An', email: 'member@example.test', phone: null } })
    if (path.endsWith('/users/me')) return route.fulfill({ json: { id: 1, role, fullName: 'Nguyễn An', email: 'member@example.test', phone: null, status: 'ACTIVE', avatarUrl: null } })
    if (path.endsWith('/auth/logout')) {
      state.signedIn = false
      return route.fulfill({ status: 204 })
    }
    if (path.endsWith('/notifications/unread-count')) return route.fulfill({ json: state.items.filter(item => !item.read).length })
    if (route.request().method() === 'PATCH' && path.includes('/notifications/')) {
      expect(route.request().headers()['x-csrf-protection']).toBe('1')
      const match = /\/notifications\/(\d+)\/read$/.exec(path)
      state.items.forEach(item => { if (!match || item.id === Number(match[1])) item.read = true })
      return route.fulfill({ status: 204 })
    }
    if (path.endsWith('/notifications')) {
      if (state.failList) return route.fulfill({ status: 503, json: {} })
      const pageNumber = Number(new URL(route.request().url()).searchParams.get('page') || 0)
      return route.fulfill({ json: { items: state.items.slice(pageNumber * 20, (pageNumber + 1) * 20), page: pageNumber, totalPages: Math.ceil(state.items.length / 20), totalElements: state.items.length } })
    }
    if (path.endsWith('/events/mine')) return route.fulfill({ json: { content: [], totalElements: 0 } })
    if (path.includes('/organizer/')) return route.fulfill({ status: 503, json: {} })
    return route.fulfill({ json: {} })
  })
  return state
}

function item(id: number): Item {
  return { id, title: `Thông báo ${id}`, content: `Nội dung dành cho bạn ${id}`, type: 'EVENT_UPDATED', createdAt: '2026-10-13T06:00:00', read: false }
}

async function changed(page: Page) {
  await page.evaluate(() => {
    const { notificationStreams } = window as typeof window & { notificationStreams: EventSource[] }
    notificationStreams.filter(source => source.readyState !== 2).forEach(source => source.dispatchEvent(new Event('notifications-changed')))
  })
}

for (const role of Object.keys(paths) as (keyof typeof paths)[]) {
  test(`${role} has a top bar bell, unread count and persistent read actions`, async ({ page }) => {
    const state = await setup(page, role)
    await page.goto(paths[role])
    const bell = page.getByRole('link', { name: 'Thông báo, 2 chưa đọc', exact: true })
    await expect(bell).toBeVisible()
    await expect(bell).toHaveAttribute('href', paths[role])
    expect(await bell.evaluate(element => !!element.closest('header'))).toBe(true)
    await expect(page.getByRole('heading', { name: 'Thông báo', exact: true })).toBeVisible()
    await expect(page.getByText('Chưa đọc', { exact: true })).toHaveCount(2)
    await page.getByRole('article').filter({ hasText: 'Thông báo 2' }).getByRole('button', { name: 'Đánh dấu đã đọc', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Thông báo, 1 chưa đọc', exact: true })).toBeVisible()
    await expect(page.getByText('Đã đọc', { exact: true })).toHaveCount(1)
    await page.getByRole('button', { name: 'Đánh dấu tất cả đã đọc', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Thông báo', exact: true })).toBeVisible()
    await expect(page.getByText('Chưa đọc', { exact: true })).toHaveCount(0)
    expect(state.items.every(item => item.read)).toBe(true)
    await page.reload()
    await expect(page.getByText('Đã đọc', { exact: true })).toHaveCount(2)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: test.info().outputPath(`notifications-${role}.png`), fullPage: true })
  })
}

for (const role of ['CUSTOMER', 'ORGANIZER'] as const) {
  test(`${role} account menu dismisses and opens password and notification pages`, async ({ page }) => {
    await setup(page, role)
    await page.goto(paths[role])
    const trigger = page.getByRole('button', { name: 'Menu tài khoản', exact: true })
    const dropdown = page.locator(`#${role.toLowerCase()}-account-menu`)
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(dropdown).toContainText('member@example.test')
    await dropdown.getByText('member@example.test', { exact: true }).click()
    await expect(dropdown).toBeVisible()
    await page.getByRole('heading', { name: 'Thông báo', exact: true }).click({ position: { x: 5, y: 5 } })
    await expect(dropdown).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.click()
    await page.keyboard.press('Escape')
    await expect(dropdown).toBeHidden()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await page.keyboard.press('Shift+Tab')
    await expect(dropdown).toBeHidden()

    await trigger.click()
    await page.screenshot({ path: test.info().outputPath(`account-menu-${role}.png`), fullPage: true, animations: 'disabled' })
    await dropdown.getByText('Đổi mật khẩu', { exact: true }).click()
    await expect(page).toHaveURL(`/${role.toLowerCase()}/profile?mode=CHANGE_PASSWORD`)
    await expect(page.getByRole('heading', { name: 'Đổi mật khẩu tài khoản', exact: true })).toBeVisible()
    await expect(dropdown).toBeHidden()
    await expect(page.getByLabel(/^Mật khẩu hiện tại/)).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Đổi mật khẩu tài khoản', exact: true })).toBeVisible()

    await page.getByRole('button', { name: /Quay lại hồ sơ/ }).click()
    await expect(page.getByRole('heading', { name: 'Thông tin cá nhân', exact: true })).toBeVisible()
    await trigger.click()
    await dropdown.getByText('Đổi mật khẩu', { exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Đổi mật khẩu tài khoản', exact: true })).toBeVisible()
    await trigger.click()
    await dropdown.getByRole('link', { name: /Thông báo/ }).click()
    await expect(page).toHaveURL(paths[role])
    await expect(dropdown).toBeHidden()
  })
}

test('customer notification footer fills short pages and follows long lists', async ({ page }) => {
  const state = await setup(page, 'CUSTOMER')
  state.items = []
  await page.goto(paths.CUSTOMER)
  await expect(page.getByText('Chưa có thông báo.', { exact: true })).toBeVisible()
  const footer = page.getByRole('contentinfo')
  await expect(footer).toBeVisible()
  const shortBounds = await footer.boundingBox()
  expect(shortBounds).not.toBeNull()
  expect(Math.abs(shortBounds!.y + shortBounds!.height - page.viewportSize()!.height)).toBeLessThanOrEqual(1)
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true)
  await page.screenshot({ path: test.info().outputPath('customer-notifications-empty.png'), fullPage: true })

  state.items = Array.from({ length: 20 }, (_, index) => item(20 - index))
  await changed(page)
  await expect(page.getByRole('article')).toHaveCount(20)
  const longBounds = await footer.boundingBox()
  const lastItem = await page.getByRole('article').last().boundingBox()
  expect(longBounds!.y).toBeGreaterThan(page.viewportSize()!.height)
  expect(longBounds!.y).toBeGreaterThan(lastItem!.y + lastItem!.height)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('SSE refreshes the list and badge, reconnects and keeps one connection across routes', async ({ page }) => {
  const state = await setup(page, 'ORGANIZER')
  await page.goto(paths.ORGANIZER)
  await expect(page.getByRole('link', { name: 'Thông báo, 2 chưa đọc', exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => (window as typeof window & { notificationStreams: EventSource[] }).notificationStreams.filter(source => source.readyState !== 2).length)).toBe(1)
  state.items.unshift(item(3))
  await changed(page)
  await expect(page.getByRole('heading', { name: 'Thông báo 3', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Thông báo, 3 chưa đọc', exact: true })).toBeVisible()

  state.items.unshift(item(4))
  await page.evaluate(() => {
    const streams = (window as typeof window & { notificationStreams: EventSource[] }).notificationStreams
    const source = streams.find(source => source.readyState !== 2)!
    source.onerror?.call(source, new Event('error'))
  })
  await expect(page.getByRole('heading', { name: 'Thông báo 4', exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => (window as typeof window & { notificationStreams: EventSource[] }).notificationStreams.length)).toBeGreaterThan(1)
  const menu = page.getByRole('button', { name: 'Mở menu điều hướng', exact: true })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('link', { name: 'TicketBo', exact: true }).click()
  await page.getByRole('link', { name: 'Thông báo, 4 chưa đọc', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Thông báo 4', exact: true })).toBeVisible()
  expect(await page.evaluate(() => (window as typeof window & { notificationStreams: EventSource[] }).notificationStreams.filter(source => source.readyState !== 2).length)).toBe(1)
})

test('list handles errors, empty data and pagination', async ({ page }) => {
  const state = await setup(page, 'CUSTOMER')
  state.failList = true
  await page.goto(paths.CUSTOMER)
  await expect(page.getByRole('alert')).toContainText('Không thể tải thông báo')
  state.failList = false
  state.items = []
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByText('Chưa có thông báo.', { exact: true })).toBeVisible()
  state.items = Array.from({ length: 21 }, (_, index) => item(21 - index))
  await changed(page)
  await expect(page.getByRole('article')).toHaveCount(20)
  await page.getByRole('button', { name: 'Sau', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('heading', { name: 'Thông báo 1', exact: true })).toBeVisible()
})

test('logout closes SSE and removes notification data from the session', async ({ page }) => {
  await setup(page, 'ORGANIZER')
  await page.goto(paths.ORGANIZER)
  await expect(page.getByRole('link', { name: 'Thông báo, 2 chưa đọc', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Menu tài khoản', exact: true }).click()
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).last().click()
  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible()
  expect(await page.evaluate(() => (window as typeof window & { notificationStreams: EventSource[] }).notificationStreams.every(source => source.readyState === 2))).toBe(true)
  await expect(page.getByRole('link', { name: /^Thông báo/ })).toHaveCount(0)
})

test('expired session during SSE reconnect redirects to login and closes the connection', async ({ page }) => {
  const state = await setup(page, 'ORGANIZER')
  await page.goto(paths.ORGANIZER)
  await expect(page.getByRole('link', { name: 'Thông báo, 2 chưa đọc', exact: true })).toBeVisible()
  await expect.poll(() => page.evaluate(() => (window as typeof window & { notificationStreams: EventSource[] }).notificationStreams.filter(source => source.readyState !== 2).length)).toBe(1)
  state.signedIn = false
  await page.route('**/api/notifications/unread-count', route => route.fulfill({ status: 401, json: {} }))
  await page.evaluate(() => {
    const source = (window as typeof window & { notificationStreams: EventSource[] }).notificationStreams.find(source => source.readyState !== 2)!
    source.onerror?.call(source, new Event('error'))
  })
  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('alert')).toContainText('Phiên đăng nhập đã hết hạn')
  expect(await page.evaluate(() => (window as typeof window & { notificationStreams: EventSource[] }).notificationStreams.every(source => source.readyState === 2))).toBe(true)
})

test('staff has no notification UI, API requests or SSE connection', async ({ page }) => {
  await setup(page, 'STAFF')
  const requests: string[] = []
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/api/notifications')) requests.push(request.url())
  })
  await page.goto('/staff/notifications')
  await expect(page).toHaveURL('/staff')
  await expect(page.getByRole('heading', { name: 'Giao diện của Staff', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Thông báo/ })).toHaveCount(0)
  expect(requests).toHaveLength(0)
  expect(await page.evaluate(() => (window as typeof window & { notificationStreams: EventSource[] }).notificationStreams.length)).toBe(0)
})
