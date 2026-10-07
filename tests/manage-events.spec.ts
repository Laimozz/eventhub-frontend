import { expect, test } from '@playwright/test'
import type { Page, Request } from '@playwright/test'
import type { EventDetail, EventSummary } from '../src/features/events/types/event'

const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j/wAAAABJRU5ErkJggg==', 'base64')
const poster = '/event-test-poster.svg'
const organizer = { id: 7, email: 'organizer@example.test', fullName: 'Cloud9 Entertainment', phone: null, role: 'ORGANIZER' }
const fixture: EventDetail = {
  id: 99, organizerId: 7, categoryId: 11, categoryName: 'Âm nhạc', name: 'Đêm nhạc Acoustic Thu',
  description: 'Một đêm nhạc đáng nhớ cùng những nghệ sĩ yêu thích.', thumbnailImageUrl: poster, bannerImageUrl: poster,
  imageZoneUrl: poster, startTime: '2030-10-20T12:00:00', endTime: '2030-10-20T15:00:00', createdAt: '2030-09-01T08:00:00',
  status: 'APPROVED', canEdit: true, canCancel: true, cancelReason: null, canceledAt: null,
  venue: { id: 4, city: 'Hà Nội', address: '123 Nguyễn Trãi', capacity: 500 },
  ticketTypes: [
    { id: 41, name: 'Vé VIP', description: 'Khu vực gần sân khấu', imageUrl: poster, price: '1500000.50', quantity: 100,
      remainingQuantity: 85, reservedQuantity: 5, saleStartTime: '2030-10-01T01:00:00', saleEndTime: '2030-10-19T16:59:00', status: 'ACTIVE' },
    { id: 42, name: 'Vé tiêu chuẩn', description: null, imageUrl: poster, price: '500000.00', quantity: 200,
      remainingQuantity: 200, reservedQuantity: 0, saleStartTime: '2030-10-01T01:00:00', saleEndTime: '2030-10-19T16:59:00', status: 'ACTIVE' },
  ],
  guests: [{ id: 21, name: 'Nghệ sĩ A', role: 'Ca sĩ chính', description: 'Acoustic live', imageUrl: poster },
    { id: 22, name: 'Khách mời B', role: 'MC', description: null, imageUrl: null }],
}
function summary(event: EventDetail): EventSummary {
  return { ...event, city: event.venue.city, address: event.venue.address }
}
function eventPart(request: Request) {
  const match = request.postDataBuffer()!.toString('utf8').match(/name="event"[^]*?\r\n\r\n([^]*?)\r\n--/)
  expect(match).not.toBeNull()
  return JSON.parse(match![1])
}
async function setup(page: Page, role = 'ORGANIZER') {
  let current = structuredClone(fixture)
  await page.route('**/api/auth/refresh', route => route.fulfill({ json: { ...organizer, role } }))
  await page.route('**/api/categories', route => route.fulfill({ json: [{ id: 11, name: 'Âm nhạc', description: null }] }))
  await page.route('**/event-test-poster.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><defs><linearGradient id="a"><stop stop-color="#0c3426"/><stop offset="1" stop-color="#20aa70"/></linearGradient></defs><rect width="800" height="450" fill="url(#a)"/><circle cx="650" cy="120" r="180" fill="#9be3b7" opacity=".15"/><text x="60" y="180" fill="#bef8d7" font-family="Arial" font-size="18" letter-spacing="5">LIVE MUSIC · EVENTHUB</text><text x="60" y="250" fill="white" font-family="Arial" font-size="55" font-weight="bold">ACOUSTIC NIGHT</text><text x="60" y="305" fill="#bef8d7" font-family="Arial" font-size="24">20.10.2030 · HÀ NỘI</text></svg>' }))
  await page.route('**/api/events/mine**', route => {
    const url = new URL(route.request().url())
    const events = [summary(current), summary({ ...fixture, id: 100, name: 'Vietnam Tech Conference', status: 'PENDING_APPROVAL' }),
      summary({ ...fixture, id: 101, name: 'Lễ hội âm nhạc mùa thu', status: 'COMPLETED', canEdit: false, canCancel: false })]
    const content = events.filter(event => (!url.searchParams.get('status') || event.status === url.searchParams.get('status')) && event.name.toLowerCase().includes((url.searchParams.get('search') ?? '').toLowerCase()))
    const statusCounts = { PENDING_APPROVAL: 0, APPROVED: 0, ONGOING: 0, COMPLETED: 0, PENDING_CANCELLATION: 0, CANCELED: 0 }
    events.forEach(event => statusCounts[event.status]++)
    return route.fulfill({ json: { content, page: 0, size: 9, totalElements: content.length, totalPages: content.length ? 1 : 0, statusCounts } })
  })
  await page.route('**/api/events/99', route => route.fulfill({ json: current }))
  await page.route('**/api/events/99/cancel', route => {
    current = { ...current, status: 'PENDING_CANCELLATION', cancelReason: route.request().postDataJSON().reason,
      canEdit: false, canCancel: false, ticketTypes: current.ticketTypes.map(ticket => ({ ...ticket, status: 'INACTIVE' })) }
    return route.fulfill({ json: current })
  })
}

test('list follows reference, searches, filters and opens real detail with Vietnam time', async ({ page }) => {
  await setup(page)
  await page.goto('/organizer/events')
  await expect(page.getByRole('heading', { name: 'Sự kiện của tôi' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Xem chi tiết', exact: true })).toHaveCount(3)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: test.info().outputPath('organizer-events.png'), fullPage: true })
  await page.getByLabel('Tìm sự kiện theo tên').fill('Acoustic')
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click()
  await expect(page).toHaveURL(/search=Acoustic/)
  await expect(page.getByRole('link', { name: 'Xem chi tiết', exact: true })).toHaveCount(1)
  await page.getByRole('link', { name: 'Xem chi tiết', exact: true }).click()
  await expect(page.getByRole('heading', { name: fixture.name, exact: true })).toBeVisible()
  await expect(page.getByText(/19:00/).first()).toBeVisible()
  await expect(page.getByRole('row', { name: /Vé VIP/ })).toContainText('10')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: test.info().outputPath('organizer-event-detail.png'), fullPage: true })
  await page.getByRole('link', { name: 'Sự kiện của tôi', exact: true }).last().click()
  await page.getByRole('button', { name: /^Chờ duyệt/ }).click()
  await expect(page).toHaveURL(/status=PENDING_APPROVAL/)
  await expect(page.getByRole('link', { name: 'Vietnam Tech Conference', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: fixture.name, exact: true })).toHaveCount(0)
})

test('editing reuses wizard, preserves images and IDs and sends UTC without uploading unchanged files', async ({ page }) => {
  await setup(page)
  let sent = 0
  await page.route('**/api/events/99', route => {
    if (route.request().method() !== 'PUT') return route.fulfill({ json: fixture })
    sent++
    const body = eventPart(route.request())
    expect(body.name).toBe('Đêm nhạc đã cập nhật')
    expect(body.startTime).toBe('2030-10-20T12:00:00')
    expect(body.ticketTypes[0].id).toBe(41)
    expect(body.guests[0].id).toBe(21)
    expect(body.removeImageZone).toBe(true)
    expect(route.request().postData()).not.toContain('name="bannerImage"')
    expect(route.request().postData()).not.toContain('name="ticketImage0"')
    return route.fulfill({ json: { ...fixture, name: body.name, status: 'PENDING_APPROVAL' } })
  })
  await page.goto('/organizer/events/99/edit/details')
  await expect(page.getByLabel('Tên sự kiện', { exact: false })).toHaveValue(fixture.name)
  await expect(page.getByLabel('Thời gian bắt đầu', { exact: false })).toHaveValue('2030-10-20T19:00')
  await expect(page.getByRole('img', { name: 'Xem trước ảnh bìa / poster', exact: true })).toHaveAttribute('src', poster)
  await page.getByLabel('Tên sự kiện', { exact: false }).fill('Đêm nhạc đã cập nhật')
  await page.getByRole('button', { name: 'Xóa sơ đồ khu vực / chỗ ngồi' }).click()
  await page.screenshot({ path: test.info().outputPath('organizer-edit-event.png'), fullPage: true })
  await page.getByRole('button', { name: 'Tiếp tục: Bước 2' }).click()
  await expect(page.getByLabel('Thể loại sự kiện')).toHaveValue('11')
  await page.getByRole('button', { name: 'Tiếp tục: Bước 3' }).click()
  await page.getByRole('button', { name: 'Lưu và gửi duyệt lại' }).click()
  await expect(page).toHaveURL('/organizer/events/99')
  await expect(page.getByRole('status')).toContainText('Đã lưu thay đổi')
  expect(sent).toBe(1)
})

test('edit adds and removes tickets and guests with indexed uploads and protects allocated tickets', async ({ page }) => {
  await setup(page)
  await page.route('**/api/events/99', route => {
    if (route.request().method() !== 'PUT') return route.fulfill({ json: fixture })
    const body = eventPart(route.request())
    expect(body.ticketTypes).toHaveLength(2)
    expect(body.ticketTypes[0].id).toBe(41)
    expect(body.ticketTypes[1]).not.toHaveProperty('id')
    expect(body.ticketTypes[1].name).toBe('Vé mới')
    expect(body.guests).toHaveLength(1)
    expect(body.guests[0].id).toBe(21)
    expect(body.guests[0].removeImage).toBe(true)
    expect(route.request().postData()).toContain('name="ticketImage1"')
    return route.fulfill({ json: { ...fixture, status: 'PENDING_APPROVAL' } })
  })
  await page.goto('/organizer/events/99/edit/category')
  await page.getByRole('button', { name: 'Xóa khách mời Khách mời B' }).click()
  await page.getByRole('button', { name: 'Sửa khách mời Nghệ sĩ A' }).click()
  await page.getByRole('button', { name: 'Xóa ảnh khách mời' }).click()
  await page.getByRole('button', { name: 'Lưu khách mời' }).click()
  await page.getByRole('button', { name: 'Tiếp tục: Bước 3' }).click()
  await expect(page.getByRole('button', { name: 'Xóa', exact: true }).first()).toBeDisabled()
  await page.getByRole('button', { name: 'Sửa', exact: true }).first().click()
  await page.getByLabel('Số lượng phát hành').fill('14')
  await page.getByRole('button', { name: 'Lưu loại vé' }).click()
  await expect(page.getByText('Số lượng không được nhỏ hơn số vé đã bán và đang giữ chỗ.')).toBeVisible()
  await page.getByLabel('Số lượng phát hành').fill('100')
  await page.getByRole('button', { name: 'Lưu loại vé' }).click()
  await page.getByRole('button', { name: 'Xóa', exact: true }).last().click()
  await page.getByRole('button', { name: 'Thêm loại vé mới' }).click()
  await page.getByLabel('Tên loại vé', { exact: false }).fill('Vé mới')
  await page.getByLabel('Giá vé (VNĐ)').fill('100000')
  await page.getByLabel('Số lượng phát hành').fill('50')
  await page.getByLabel('Bắt đầu bán vé').fill('2030-10-01T08:00')
  await page.getByLabel('Kết thúc bán vé').fill('2030-10-19T23:59')
  await page.locator('#ticket-image-file').setInputFiles({ name: 'ticket.png', mimeType: 'image/png', buffer: pixel })
  await page.getByRole('button', { name: 'Lưu loại vé' }).click()
  await page.getByRole('button', { name: 'Lưu và gửi duyệt lại' }).click()
  await expect(page).toHaveURL('/organizer/events/99')
})

test('cancel validates reason, submits once, shows pending cancellation and hides further actions', async ({ page }) => {
  await setup(page)
  await page.goto('/organizer/events/99')
  await page.getByRole('button', { name: 'Hủy sự kiện', exact: true }).click()
  await page.getByRole('button', { name: 'Gửi yêu cầu hủy' }).click()
  await expect(page.getByRole('alert')).toContainText('Vui lòng nhập lý do')
  await page.getByLabel('Lý do hủy').fill('Địa điểm không còn khả dụng')
  await page.getByRole('button', { name: 'Gửi yêu cầu hủy' }).click()
  await expect(page.getByText('Yêu cầu hủy đang chờ Admin xét duyệt')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hủy sự kiện', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Chỉnh sửa thông tin' })).toHaveCount(0)
  await expect(page.getByText('Lý do: Địa điểm không còn khả dụng')).toBeVisible()
})

test('list pagination and empty search preserve URL state and recover after server error', async ({ page }) => {
  await setup(page)
  let attempts = 0
  await page.route('**/api/events/mine**', route => {
    const url = new URL(route.request().url())
    if (++attempts === 1) return route.fulfill({ status: 500, json: {} })
    const currentPage = Number(url.searchParams.get('page') ?? '0')
    return route.fulfill({ json: { content: url.searchParams.get('search') ? [] : [summary(fixture)], page: currentPage,
      size: 9, totalElements: url.searchParams.get('search') ? 0 : 10, totalPages: url.searchParams.get('search') ? 0 : 2,
      statusCounts: { PENDING_APPROVAL: 0, APPROVED: 10, ONGOING: 0, COMPLETED: 0, PENDING_CANCELLATION: 0, CANCELED: 0 } } })
  })
  await page.goto('/organizer/events')
  await expect(page.getByRole('alert')).toBeVisible()
  await page.getByRole('button', { name: 'Thử lại' }).click()
  await page.getByRole('button', { name: 'Trang sau' }).click()
  await expect(page).toHaveURL(/page=1/)
  await expect(page.getByText('Trang 2 / 2')).toBeVisible()
  await page.getByLabel('Tìm sự kiện theo tên').fill('Không tồn tại')
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Không tìm thấy sự kiện phù hợp' })).toBeVisible()
  await expect(page).not.toHaveURL(/page=1/)
  await page.goBack()
  await expect(page.getByText('Trang 2 / 2')).toBeVisible()
  await expect(page.getByLabel('Tìm sự kiện theo tên')).toHaveValue('')
})

test('edit errors keep form available and completed events reject direct edit links', async ({ page }) => {
  await setup(page)
  await page.route('**/api/events/99', route => route.fulfill(route.request().method() === 'PUT' ? { status: 409, json: {} } : { json: fixture }))
  await page.goto('/organizer/events/99/edit/tickets')
  await page.getByRole('button', { name: 'Lưu và gửi duyệt lại' }).click()
  await expect(page.getByRole('alert').first()).toContainText('Không thể thực hiện')
  await expect(page.getByRole('button', { name: 'Lưu và gửi duyệt lại' })).toBeEnabled()
  await page.route('**/api/events/99', route => route.fulfill({ json: { ...fixture, status: 'COMPLETED', canEdit: false, canCancel: false } }))
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Sự kiện không thể chỉnh sửa' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lưu và gửi duyệt lại' })).toHaveCount(0)
})

test('customer cannot access organizer management and missing details provide navigation', async ({ page }) => {
  await setup(page, 'CUSTOMER')
  await page.goto('/organizer/events/99/edit/details')
  await expect(page).toHaveURL('/')
  await setup(page)
  await page.route('**/api/events/99', route => route.fulfill({ status: 404, json: {} }))
  await page.goto('/organizer/events/99')
  await expect(page.getByRole('alert')).toContainText('không tồn tại')
  await expect(page.getByRole('link', { name: 'Về danh sách' })).toBeVisible()
})
