import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { PublicEventDetailResponse, PublicEventSummaryResponse, TicketSalesStatus } from '../src/features/customer/types/event'

const now = new Date('2030-06-01T05:00:00Z')
const user = { id: 1, email: 'member@example.test', fullName: 'Nguyễn An', phone: '0908123456', role: 'CUSTOMER' }
const poster = '/public-test-poster.svg'
const detail: PublicEventDetailResponse = {
  id: 1, name: 'Đêm nhạc EventHub', description: 'Sự kiện được mở bán theo từng đợt.',
  thumbnailImageUrl: poster, bannerImageUrl: poster, imageZoneUrl: null,
  startTime: '2030-06-02T12:00:00', endTime: '2030-06-02T15:00:00',
  organizerName: 'EventHub Live', categoryName: 'Âm nhạc', venue: { city: 'Hà Nội', address: 'Nhà hát Hà Nội' },
  startingPrice: 125000, status: 'APPROVED', salesStatus: 'ON_SALE', suggestedEvents: [],
  ticketTypes: [{ id: 11, name: 'Vé khu vực B', description: 'Khu vực B theo hồ sơ sự kiện', price: 125000,
    remainingQuantity: 9, saleStartTime: '2030-05-31T00:00:00', saleEndTime: '2030-06-02T10:00:00', salesStatus: 'ON_SALE' }],
}

async function setup(page: Page, event = detail, role?: string) {
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url())
    if (!url.pathname.startsWith('/api/')) return route.continue()
    if (url.pathname === '/api/auth/refresh') return route.fulfill({ status: role ? 200 : 401, json: role ? { ...user, role } : {} })
    if (url.pathname === '/api/categories') return route.fulfill({ json: [{ id: 7, name: 'Âm nhạc', description: null }] })
    if (url.pathname === '/api/public/events/1') return route.fulfill({ json: event })
    if (url.pathname === '/api/public/events') {
      const pageNumber = Number(url.searchParams.get('page') || 0)
      const content: PublicEventSummaryResponse[] = Array.from({ length: Math.max(0, Math.min(12, 25 - pageNumber * 12)) }, (_, index) => ({
        ...event, id: pageNumber * 12 + index + 1, name: `Sự kiện ${pageNumber * 12 + index + 1}`, city: event.venue.city,
      }))
      return route.fulfill({ json: { content, page: pageNumber, size: 12, totalElements: 25, totalPages: 3 } })
    }
    if (url.pathname === '/api/users/me') return route.fulfill({ json: { ...user, role, status: 'ACTIVE', avatarUrl: null } })
    if (url.pathname === '/api/notifications/unread-count') return route.fulfill({ json: 0 })
    if (url.pathname === '/api/notifications/stream') return route.fulfill({ status: 204 })
    if (url.pathname === '/api/staff/events') return route.fulfill({ json: [] })
    if (url.pathname === '/api/events/mine') return route.fulfill({ json: { content: [], totalElements: 0 } })
    if (url.pathname === '/api/organizer/dashboard/monthly-stats' || url.pathname === '/api/organizer/dashboard/event-performance') return route.fulfill({ json: [] })
    if (url.pathname === '/api/organizer/dashboard/checkin-alert') return route.fulfill({ json: null })
    return route.fulfill({ json: { items: [], page: 0, pageSize: 20, totalElements: 0, totalPages: 0 } })
  })
  await page.route('**/public-test-poster.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="800" height="450" fill="#174d38"/></svg>' }))
}

test('explore reaches every page, preserves filters and restores pages with Back and Forward', async ({ page }) => {
  await setup(page)
  await page.goto('/customer/explore?categoryId=7&city=H%C3%A0+N%E1%BB%99i&search=nhac')
  await expect(page.getByRole('heading', { name: 'Sự kiện 12', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Trang trước', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sự kiện 13', exact: true })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('categoryId')).toBe('7')
  expect(new URL(page.url()).searchParams.get('city')).toBe('Hà Nội')
  expect(new URL(page.url()).searchParams.get('search')).toBe('nhac')
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sự kiện 25', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Trang sau', exact: true })).toBeDisabled()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Sự kiện 13', exact: true })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('heading', { name: 'Sự kiện 25', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: test.info().outputPath('explore-pagination.png'), fullPage: true })
})

test('changing or removing filters and submitting a search return to the first page', async ({ page }) => {
  await setup(page)
  await page.goto('/customer/explore?page=2&city=H%C3%A0+N%E1%BB%99i')
  await expect(page.getByRole('heading', { name: 'Sự kiện 25', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Xóa bộ lọc thành phố', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sự kiện 1', exact: true })).toBeVisible()
  expect(new URL(page.url()).searchParams.has('city')).toBe(false)
  expect(new URL(page.url()).searchParams.has('page')).toBe(false)
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Sự kiện 25', exact: true })).toBeVisible()
  await expect(page.locator('select').first()).toHaveValue('Hà Nội')
  await page.getByRole('radio', { name: 'Âm nhạc', exact: true }).check()
  await page.getByRole('button', { name: 'Áp dụng bộ lọc', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sự kiện 1', exact: true })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('categoryId')).toBe('7')
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click()
  const search = page.getByPlaceholder('Tìm kiếm sự kiện, nghệ sĩ, địa điểm...')
  if (await search.isVisible()) {
    await search.fill('acoustic')
    await search.press('Enter')
    await expect(page.getByRole('heading', { name: 'Sự kiện 1', exact: true })).toBeVisible()
    expect(new URL(page.url()).searchParams.has('page')).toBe(false)
  }
})

test('out-of-range pages recover to the final page and network failures offer a retry', async ({ page }) => {
  await setup(page)
  await page.goto('/customer/explore?page=999&categoryId=7')
  await expect(page.getByRole('heading', { name: 'Sự kiện 25', exact: true })).toBeVisible()
  expect(new URL(page.url()).searchParams.get('page')).toBe('2')
  let failing = true
  await page.route('**/api/public/events?*', route => failing ? route.fulfill({ status: 500, json: {} }) : route.fulfill({ json: { content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 } }))
  await page.goto('/customer/explore')
  await expect(page.getByRole('alert')).toContainText('Không thể tải danh sách sự kiện')
  failing = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Không tìm thấy sự kiện nào', exact: true })).toBeVisible()
})

for (const [salesStatus, label] of [
  ['NOT_ON_SALE', 'Chưa mở bán'], ['ON_SALE', 'Đang mở bán'], ['SOLD_OUT', 'Hết vé'],
  ['SALES_ENDED', 'Đã đóng bán'], ['UNAVAILABLE', 'Tạm ngừng bán'],
] as [TicketSalesStatus, string][]) {
  test(`customer sees ${salesStatus} from real ticket data and can only book open sales`, async ({ page }) => {
    await page.clock.install({ time: now })
    const event = { ...detail, salesStatus, ticketTypes: [{ ...detail.ticketTypes[0], salesStatus,
      saleStartTime: salesStatus === 'NOT_ON_SALE' ? '2030-06-01T12:00:00' : detail.ticketTypes[0].saleStartTime,
      saleEndTime: salesStatus === 'SALES_ENDED' ? '2030-06-01T04:00:00' : detail.ticketTypes[0].saleEndTime,
      remainingQuantity: salesStatus === 'SOLD_OUT' ? 0 : 9 }] }
    await setup(page, event)
    await page.goto('/customer/explore')
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
    await page.goto('/customer/events/1')
    await expect(page.getByText('Sắp diễn ra', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Vé khu vực B', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'VIP Fanzone', exact: true })).toHaveCount(0)
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
    await expect(page.getByText(/Bắt đầu: 19:00/)).toBeVisible()
    const action = page.getByRole('button', { name: salesStatus === 'ON_SALE' ? 'Đặt vé ngay' : label, exact: true })
    if (salesStatus === 'ON_SALE') await expect(action).toBeEnabled()
    else await expect(action).toBeDisabled()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: test.info().outputPath(`ticket-status-${salesStatus}.png`), fullPage: true })
  })
}

for (const status of ['ONGOING', 'COMPLETED'] as const) {
  test(`event ${status} cannot be booked even if a stale response says tickets are on sale`, async ({ page }) => {
    await page.clock.install({ time: now })
    await setup(page, { ...detail, status })
    await page.goto('/customer/events/1')
    await expect(page.getByRole('button', { name: status === 'ONGOING' ? 'Đang diễn ra' : 'Đã kết thúc', exact: true })).toBeDisabled()
    await expect(page.getByText('Đã đóng bán', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Còn 9 vé', { exact: true })).toHaveCount(0)
  })
}

for (const [path, role, homePath, destination] of [
  ['/login', undefined, '/customer', '/customer'],
  ['/register', undefined, '/customer', '/customer'],
  ['/customer/explore', undefined, '/customer', '/customer'],
  ['/customer/explore', 'CUSTOMER', '/customer', '/customer'],
  ['/admin/users', 'ADMIN', '/admin', '/admin/events/pending'],
  ['/organizer/profile', 'ORGANIZER', '/organizer', '/organizer'],
  ['/staff/profile', 'STAFF', '/staff', '/staff'],
  ['/customer/explore', 'ADMIN', '/admin', '/admin/events/pending'],
  ['/customer/explore', 'ORGANIZER', '/organizer', '/organizer'],
  ['/customer/explore', 'STAFF', '/staff', '/staff'],
] as const) {
  test(`EventHub logo on ${path} returns ${role ?? 'guest'} to ${destination}`, async ({ page }) => {
    await setup(page, detail, role)
    await page.goto(path)
    const logo = page.getByRole('link', { name: 'EventHub — Trang chủ', exact: true, includeHidden: true }).first()
    await expect(logo).toHaveAttribute('href', homePath)
    const menu = page.getByRole('button', { name: /Mở menu/ })
    if (await menu.isVisible()) await menu.click()
    await logo.click()
    await expect(page).toHaveURL(destination)
    await expect(logo).toBeAttached()
  })
}
