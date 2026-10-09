import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const admin = { id: 1, fullName: 'Quản trị viên', email: 'admin@example.test', phone: null, role: 'ADMIN' }
const customer = { id: 2, fullName: 'Người dùng thử', email: 'member@example.test', phone: '0900000000', role: 'CUSTOMER', status: 'ACTIVE' }
const category = { id: 3, name: 'Âm nhạc', description: 'Biểu diễn và hòa nhạc' }
const event = {
  id: 8, name: 'Đêm nhạc mùa thu', organizerId: 4, categoryId: 3, categoryName: 'Âm nhạc',
  description: 'Một đêm nhạc dành cho cộng đồng.', thumbnailImageUrl: '/src/assets/hero.png', bannerImageUrl: '/src/assets/hero.png', imageZoneUrl: null,
  startTime: '2026-11-10T12:00:00', endTime: '2026-11-10T15:00:00', createdAt: '2026-10-07T07:00:00',
  status: 'PENDING_APPROVAL', canEdit: false, canCancel: false, cancelReason: null, canceledAt: null, rejectReason: null,
  venue: { id: 1, city: 'Hồ Chí Minh', address: 'Nhà hát cộng đồng', capacity: 100 },
  guests: [{ id: 1, name: 'Nghệ sĩ khách mời', role: 'Ca sĩ', description: 'Biểu diễn acoustic', imageUrl: null }],
  ticketTypes: [{ id: 1, name: 'Vé phổ thông', description: 'Vào cửa', imageUrl: '/src/assets/hero.png', price: '200000', quantity: 100, reservedQuantity: 0, remainingQuantity: 100, saleStartTime: '2026-10-09T01:00:00', saleEndTime: '2026-11-09T10:00:00', status: 'INACTIVE' }],
}
const organizer = { id: 4, fullName: 'Ban tổ chức', email: 'organizer@example.test' }
const detail = { event, organizer, version: 2 }
const list = <T>(items: T[]) => ({ items, page: 0, pageSize: 20, totalElements: items.length, totalPages: items.length ? 1 : 0 })
async function login(page: Page, role = 'ADMIN') {
  await page.route('**/api/auth/refresh', route => route.fulfill({ json: { ...admin, role } }))
}
async function pending(page: Page) {
  await page.route('**/api/admin/events/pending', route => route.fulfill({ json: list([{ ...event, organizer }]) }))
  await page.route('**/api/admin/events/pending/8', route => route.fulfill({ json: detail }))
}

test('admin landing and pending list are responsive', async ({ page }) => {
  await login(page); await pending(page)
  await page.goto('/')
  await expect(page).toHaveURL('/admin/events/pending')
  await expect(page.getByRole('link', { name: event.name })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)
  await page.screenshot({ path: test.info().outputPath('admin-pending.png'), fullPage: true })
})
test('customer cannot enter admin routes', async ({ page }) => {
  await login(page, 'CUSTOMER')
  let calls = 0
  await page.route('**/api/admin/**', route => { calls++; return route.fulfill({ status: 403 }) })
  await page.goto('/admin/users')
  await expect(page).toHaveURL('/')
  expect(calls).toBe(0)
})
test('user form handles duplicate email, creates user and locks account', async ({ page }) => {
  await login(page)
  let duplicate = true
  let creations = 0
  await page.route('**/api/admin/users**', route => {
    if (route.request().method() === 'PATCH') {
      expect(route.request().postDataJSON()).toEqual({ status: 'LOCKED' })
      expect(route.request().headers()['x-csrf-protection']).toBe('1')
      return route.fulfill({ json: { ...customer, status: 'LOCKED' } })
    }
    if (route.request().method() === 'POST') {
      creations++
      expect(route.request().postDataJSON().role).toBe('CUSTOMER')
      return duplicate ? route.fulfill({ status: 409, json: { code: 'EMAIL_ALREADY_EXISTS' } }) : route.fulfill({ status: 201, json: customer })
    }
    return route.fulfill({ json: list([{ ...admin, status: 'ACTIVE' }, customer]) })
  })
  await page.goto('/admin/users')
  await expect(page.getByRole('row').filter({ hasText: admin.email }).getByRole('button', { name: 'Khóa', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Thêm người dùng' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Họ và tên').fill(customer.fullName)
  await dialog.getByLabel('Email', { exact: true }).fill(customer.email)
  await dialog.getByLabel('Số điện thoại').fill(customer.phone)
  await dialog.getByLabel('Mật khẩu', { exact: true }).fill('Test-password-123')
  await dialog.getByRole('button', { name: 'Tạo người dùng' }).click()
  await expect(dialog.getByRole('alert')).toContainText('Email đã được sử dụng')
  duplicate = false
  await dialog.getByRole('button', { name: 'Tạo người dùng' }).click()
  await expect(dialog).toHaveCount(0)
  expect(creations).toBe(2)
  await page.getByRole('row').filter({ hasText: customer.email }).getByRole('button', { name: 'Khóa', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.screenshot({ path: test.info().outputPath('admin-users.png'), fullPage: true })
})
test('category edit preserves name and used category cannot be deleted', async ({ page }) => {
  await login(page)
  await page.route('**/api/admin/event-categories**', route => {
    if (route.request().method() === 'DELETE') return route.fulfill({ status: 409, json: { code: 'CATEGORY_IN_USE' } })
    if (route.request().method() === 'PUT') { expect(route.request().postDataJSON().name).toBe(category.name); return route.fulfill({ json: category }) }
    return route.fulfill({ json: list([category]) })
  })
  await page.goto('/admin/event-categories')
  await page.getByRole('button', { name: 'Sửa Âm nhạc' }).click()
  await page.getByRole('dialog').getByLabel('Mô tả').fill('Mô tả mới')
  await page.getByRole('button', { name: 'Lưu danh mục' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByRole('button', { name: 'Xóa Âm nhạc' }).click()
  await page.getByRole('button', { name: 'Xác nhận xóa' }).click()
  await expect(page.getByRole('alert')).toContainText('đang được sử dụng')
  await page.getByRole('button', { name: 'Hủy bỏ' }).click()
  await page.screenshot({ path: test.info().outputPath('admin-categories.png'), fullPage: true })
})
test('approval requires confirmation and sends revision only once', async ({ page }) => {
  await login(page); await pending(page)
  let calls = 0
  await page.route('**/api/admin/events/8/approve', async route => {
    calls++
    expect(route.request().postDataJSON()).toEqual({ version: 2 })
    await new Promise(resolve => setTimeout(resolve, 150))
    await route.fulfill({ json: { status: 'APPROVED' } })
  })
  await page.goto('/admin/events/pending/8')
  await expect(page.getByText('Nghệ sĩ khách mời', { exact: true })).toBeVisible()
  await page.locator('img').evaluateAll(images => Promise.all(images.map(image => (image as HTMLImageElement).decode())))
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)
  await page.screenshot({ path: test.info().outputPath('admin-detail.png'), fullPage: true })
  await page.getByRole('button', { name: 'Duyệt sự kiện', exact: true }).click()
  await page.getByRole('button', { name: 'Hủy bỏ' }).click()
  expect(calls).toBe(0)
  await page.getByRole('button', { name: 'Duyệt sự kiện', exact: true }).click()
  await page.getByRole('button', { name: 'Xác nhận duyệt', exact: true }).click()
  await expect(page).toHaveURL('/admin/events/pending')
  expect(calls).toBe(1)
})
test('rejection validates whitespace and disables stale decision', async ({ page }) => {
  await login(page); await pending(page)
  let calls = 0
  await page.route('**/api/admin/events/8/reject', route => {
    calls++
    expect(route.request().postDataJSON()).toEqual({ version: 2, reason: 'Bổ sung địa điểm' })
    return route.fulfill({ status: 409, json: { code: 'EVENT_VERSION_CONFLICT' } })
  })
  await page.goto('/admin/events/pending/8')
  await page.getByRole('button', { name: 'Từ chối', exact: true }).click()
  await page.getByRole('textbox', { name: /Lý do từ chối/ }).fill('   ')
  await page.getByRole('button', { name: 'Xác nhận từ chối' }).click()
  await expect(page.getByRole('alert')).toContainText('Vui lòng nhập')
  expect(calls).toBe(0)
  await page.getByRole('textbox', { name: /Lý do từ chối/ }).fill(' Bổ sung địa điểm ')
  await page.getByRole('button', { name: 'Xác nhận từ chối' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Duyệt sự kiện', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Tải lại hồ sơ' }).click()
  await expect(page.getByRole('button', { name: 'Duyệt sự kiện', exact: true })).toBeEnabled()
})
test('pending list shows retry and empty state', async ({ page }) => {
  await login(page)
  let failed = true
  await page.route('**/api/admin/events/pending', route => failed ? route.fulfill({ status: 503 }) : route.fulfill({ json: list([]) }))
  await page.goto('/admin/events/pending')
  await expect(page.getByRole('alert')).toBeVisible()
  failed = false
  await page.getByRole('button', { name: 'Thử lại' }).click()
  await expect(page.getByText('Không có sự kiện chờ duyệt.')).toBeVisible()
})
test('organizer can read review notification', async ({ page }) => {
  await login(page, 'ORGANIZER')
  await page.route(url => url.pathname === '/api/notifications', route => route.fulfill({ json: list([{ id: 1, title: 'Sự kiện #8 bị từ chối', content: 'Bổ sung địa điểm', type: 'EVENT_REJECTED', createdAt: event.createdAt, read: false }]) }))
  await page.goto('/organizer/notifications')
  await expect(page.getByText('Bổ sung địa điểm', { exact: true })).toBeVisible()
})
