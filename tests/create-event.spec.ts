import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { Request } from '@playwright/test'

const organizer = { id: 7, email: 'organizer@example.test', fullName: 'Cloud9 Entertainment', phone: null, role: 'ORGANIZER' }
const categories = [{ id: 11, name: 'Âm nhạc', description: 'Concert và các chương trình âm nhạc.' }, { id: 25, name: 'Hội thảo', description: null }]
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j/wAAAABJRU5ErkJggg==', 'base64')

function eventPart(request: Request) {
  const body = request.postDataBuffer()!.toString('utf8')
  const event = body.match(/name="event"[^]*?\r\n\r\n([^]*?)\r\n--/)
  expect(event).not.toBeNull()
  return JSON.parse(event![1])
}

async function selectImage(page: Page, id: string) {
  await page.locator(`#${id}-file`).setInputFiles({ name: `${id}.png`, mimeType: 'image/png', buffer: pixel })
}

async function session(page: Page, role = 'ORGANIZER') {
  await page.route('**/api/auth/refresh', route => route.fulfill({ json: { ...organizer, role }, headers: { 'Set-Cookie': 'access_token=event-test-session; Path=/api; HttpOnly; SameSite=Lax' } }))
  await page.route('**/api/categories', route => route.fulfill({ json: categories }))
}
async function details(page: Page) {
  await page.getByLabel('Tên sự kiện', { exact: false }).fill('Đêm nhạc Acoustic Thu')
  await page.getByLabel('Mô tả sự kiện').fill('Một đêm nhạc đáng nhớ.')
  await page.getByLabel('Tỉnh / Thành phố').fill('Hà Nội')
  await page.getByLabel('Sức chứa dự kiến').fill('500')
  await page.getByLabel('Địa chỉ chi tiết').fill('123 Nguyễn Trãi')
  await page.getByLabel('Thời gian bắt đầu', { exact: false }).fill('2030-10-20T19:00')
  await page.getByLabel('Thời gian kết thúc', { exact: false }).fill('2030-10-20T22:00')
  await selectImage(page, 'bannerImage')
  await selectImage(page, 'thumbnailImage')
}
async function categoryStep(page: Page) {
  await details(page)
  await page.getByRole('button', { name: 'Tiếp tục: Bước 2' }).click()
  await expect(page).toHaveURL('/organizer/events/new/category')
  await page.getByLabel('Thể loại sự kiện').selectOption('11')
}
async function addTicket(page: Page, quantity = '100') {
  await page.getByRole('button', { name: 'Thêm loại vé mới', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Thiết lập loại vé' })
  await dialog.getByLabel('Tên loại vé', { exact: false }).fill('Vé VIP')
  await dialog.getByLabel('Giá vé (VNĐ)').fill('1500000.50')
  await dialog.getByLabel('Số lượng phát hành').fill(quantity)
  await dialog.getByLabel('Bắt đầu bán vé').fill('2030-10-01T08:00')
  await dialog.getByLabel('Kết thúc bán vé').fill('2030-10-19T23:59')
  await selectImage(page, 'ticket-image')
  await dialog.getByRole('button', { name: 'Lưu loại vé' }).click()
  await expect(dialog).not.toBeVisible()
}

test('organizer dashboard follows reference and unrelated sections remain placeholders', async ({ page }) => {
  await session(page)
  await page.goto('/')
  await expect(page).toHaveURL('/organizer')
  await expect(page.getByRole('heading', { name: 'Tổng quan ban tổ chức' })).toBeVisible()
  await expect(page.getByText(/Giao diện minh họa/)).toBeVisible()
  await page.screenshot({ path: test.info().outputPath('organizer-dashboard.png'), fullPage: true })
  if (test.info().project.name === 'mobile') await page.getByRole('button', { name: 'Mở menu điều hướng' }).click()
  await expect(page.getByRole('button', { name: 'Quản lý Booking' })).toBeDisabled()
  await page.getByRole('link', { name: 'Tạo sự kiện mới', exact: true }).first().click()
  await expect(page).toHaveURL('/organizer/events/new/details')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: test.info().outputPath('event-details.png'), fullPage: true })
})

test('only organizer can access wizard and incomplete direct links return to step one', async ({ page }) => {
  await session(page, 'CUSTOMER')
  await page.goto('/organizer/events/new/details')
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()
  await session(page)
  await page.goto('/organizer/events/new/tickets')
  await expect(page).toHaveURL('/organizer/events/new/details')
})

test('three separate steps send exact backend payload and Vietnam time becomes UTC', async ({ page }) => {
  await session(page)
  let requests = 0
  await page.route('**/api/events', async route => {
    requests++
    expect(route.request().headers()['x-csrf-protection']).toBe('1')
    expect(route.request().headers().cookie).toContain('access_token=event-test-session')
    expect(route.request().headers()['content-type']).toContain('multipart/form-data; boundary=')
    expect(route.request().postDataBuffer()!.toString('utf8')).toContain('name="bannerImage"')
    expect(route.request().postDataBuffer()!.toString('utf8')).toContain('name="thumbnailImage"')
    expect(route.request().postDataBuffer()!.toString('utf8')).toContain('name="ticketImage0"')
    expect(eventPart(route.request())).toEqual({
      name: 'Đêm nhạc Acoustic Thu', description: 'Một đêm nhạc đáng nhớ.', categoryId: 11,
      startTime: '2030-10-20T12:00:00', endTime: '2030-10-20T15:00:00',
      venue: { city: 'Hà Nội', address: '123 Nguyễn Trãi', capacity: 500 },
      guests: [{ name: 'Nguyễn Văn A', role: 'Ca sĩ chính', description: null }],
      ticketTypes: [{ name: 'Vé VIP', description: null, price: '1500000.50', quantity: 100, saleStartTime: '2030-10-01T01:00:00', saleEndTime: '2030-10-19T16:59:00' }],
    })
    await new Promise(resolve => setTimeout(resolve, 250))
    await route.fulfill({ status: 201, json: { id: 99, name: 'Đêm nhạc Acoustic Thu', status: 'PENDING_APPROVAL' } })
  })
  await page.goto('/organizer/events/new/details')
  await categoryStep(page)
  await expect(page.getByLabel('Tên sự kiện')).toHaveCount(0)
  await page.screenshot({ path: test.info().outputPath('event-category.png'), fullPage: true })
  await page.getByRole('button', { name: 'Thêm khách mời', exact: true }).click()
  await page.getByLabel('Tên khách mời / Nghệ sĩ').fill('Nguyễn Văn A')
  await page.getByLabel('Vai trò / Danh hiệu').fill('Ca sĩ chính')
  await selectImage(page, 'guest-image')
  await page.screenshot({ path: test.info().outputPath('guest-dialog.png'), fullPage: true })
  await page.getByRole('button', { name: 'Lưu khách mời' }).click()
  await expect(page.getByText('Nguyễn Văn A', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Tiếp tục: Bước 3' }).click()
  await expect(page).toHaveURL('/organizer/events/new/tickets')
  await addTicket(page)
  await page.screenshot({ path: test.info().outputPath('event-tickets.png'), fullPage: true })
  await page.getByRole('button', { name: 'Xem trước', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Xem trước sự kiện' })).toContainText('Đêm nhạc Acoustic Thu')
  await page.getByRole('button', { name: 'Đóng', exact: true }).click()
  await page.getByRole('button', { name: 'Gửi Admin xét duyệt' }).click()
  await expect(page.getByRole('button', { name: 'Đang gửi hồ sơ…' })).toBeDisabled()
  await expect(page.getByRole('heading', { name: 'Đã gửi sự kiện chờ duyệt!' })).toBeVisible()
  expect(requests).toBe(1)
  expect(await page.evaluate(() => sessionStorage.getItem('eventhub:event-draft:7'))).toBeNull()
})

test('validation prevents empty steps, invalid sale times and capacity overflow', async ({ page }) => {
  await session(page)
  let sent = 0
  await page.route('**/api/events', route => { sent++; return route.fulfill({ status: 500 }) })
  await page.goto('/organizer/events/new/details')
  await page.getByRole('button', { name: 'Tiếp tục: Bước 2' }).click()
  await expect(page).toHaveURL('/organizer/events/new/details')
  await expect(page.getByText('Thời gian bắt đầu phải ở tương lai.')).toBeVisible()
  await categoryStep(page)
  await page.getByRole('button', { name: 'Tiếp tục: Bước 3' }).click()
  await page.getByRole('button', { name: 'Gửi Admin xét duyệt' }).click()
  await expect(page.getByRole('alert')).toContainText('ít nhất một loại vé')
  await addTicket(page, '501')
  await page.getByRole('button', { name: 'Gửi Admin xét duyệt' }).click()
  await expect(page.getByRole('alert').first()).toContainText('không được vượt quá sức chứa')
  await page.getByRole('button', { name: 'Sửa', exact: true }).click()
  await page.getByLabel('Số lượng phát hành').fill('100')
  await page.getByLabel('Kết thúc bán vé').fill('2030-10-20T19:00')
  await page.getByRole('button', { name: 'Lưu loại vé' }).click()
  await expect(page.getByText('Kết thúc bán không trước bắt đầu bán và phải trước sự kiện.')).toBeVisible()
  expect(sent).toBe(0)
})

test('reload and browser back preserve draft, deleting guests and tickets updates summary', async ({ page }) => {
  await session(page)
  await page.goto('/organizer/events/new/details')
  await categoryStep(page)
  await page.getByRole('button', { name: 'Thêm khách mời', exact: true }).click()
  await page.getByLabel('Tên khách mời / Nghệ sĩ').fill('Diễn giả A')
  await page.getByLabel('Vai trò / Danh hiệu').fill('Diễn giả')
  await page.getByRole('button', { name: 'Lưu khách mời' }).click()
  await page.getByRole('button', { name: 'Xóa khách mời Diễn giả A' }).click()
  await page.reload()
  await expect(page).toHaveURL('/organizer/events/new/details')
  await expect(page.getByLabel('Tên sự kiện', { exact: false })).toHaveValue('Đêm nhạc Acoustic Thu')
  await selectImage(page, 'bannerImage')
  await selectImage(page, 'thumbnailImage')
  await page.getByRole('button', { name: 'Tiếp tục: Bước 2' }).click()
  await expect(page.getByLabel('Thể loại sự kiện')).toHaveValue('11')
  await expect(page.getByText('Chưa có khách mời', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Tiếp tục: Bước 3' }).click()
  await addTicket(page)
  await page.getByRole('button', { name: 'Nhân bản', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Vé VIP (bản sao)' })).toBeVisible()
  await page.getByRole('button', { name: 'Xóa', exact: true }).last().click()
  await page.goBack()
  await expect(page).toHaveURL('/organizer/events/new/category')
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click()
  await expect(page.getByLabel('Tên sự kiện', { exact: false })).toHaveValue('Đêm nhạc Acoustic Thu')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('category failures can be retried and server failures preserve editable form', async ({ page }) => {
  await session(page)
  let count = 0
  await page.route('**/api/categories', route => route.fulfill(++count === 1 ? { status: 500, json: {} } : { json: categories }))
  await page.route('**/api/events', route => route.fulfill({ status: 500, json: {} }))
  await page.goto('/organizer/events/new/details')
  await details(page)
  await page.getByRole('button', { name: 'Tiếp tục: Bước 2' }).click()
  await page.getByRole('button', { name: 'Tải lại danh mục' }).click()
  await page.getByLabel('Thể loại sự kiện').selectOption('11')
  await page.getByRole('button', { name: 'Tiếp tục: Bước 3' }).click()
  await addTicket(page)
  await page.getByRole('button', { name: 'Gửi Admin xét duyệt' }).click()
  await expect(page.getByRole('alert')).toContainText('Máy chủ chưa thể xử lý')
  await expect(page.getByRole('button', { name: 'Gửi Admin xét duyệt' })).toBeEnabled()
  await expect(page.getByRole('heading', { name: 'Vé VIP', exact: true })).toBeVisible()
})

test('images preview locally without uploads or URL fields until submitting event', async ({ page }) => {
  await session(page)
  let uploads = 0
  await page.route('**/api/events/images', async route => {
    uploads++
    await route.fulfill({ status: 500 })
  })
  await page.goto('/organizer/events/new/details')
  await details(page)
  await expect(page.getByText(/Hoặc nhập đường dẫn/)).toHaveCount(0)
  const preview = page.getByRole('img', { name: 'Xem trước ảnh bìa / poster', exact: true })
  await expect(preview).toHaveAttribute('src', /^blob:/)
  await expect.poll(() => preview.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
  if (test.info().project.name === 'desktop') {
    const city = await page.getByLabel('Tỉnh / Thành phố').boundingBox()
    const capacity = await page.getByLabel('Sức chứa dự kiến').boundingBox()
    expect(city!.y).toBe(capacity!.y)
    expect(city!.height).toBe(capacity!.height)
  }
  await page.locator('#thumbnailImage-file').setInputFiles({ name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') })
  await expect(page.getByText('Vui lòng chọn ảnh JPG hoặc PNG.')).toBeVisible()
  expect(uploads).toBe(0)
  await page.screenshot({ path: test.info().outputPath('local-preview-and-alignment.png'), fullPage: true })
  await page.getByRole('button', { name: 'Tiếp tục: Bước 2' }).click()
  await page.getByLabel('Thể loại sự kiện').selectOption('11')
  await page.getByRole('button', { name: 'Tiếp tục: Bước 3' }).click()
  await addTicket(page)
  await page.route('**/api/events', async route => {
    expect(route.request().headers()['content-type']).toContain('multipart/form-data; boundary=')
    expect(eventPart(route.request())).not.toHaveProperty('bannerImageUrl')
    await route.fulfill({ status: 201, json: { id: 99, name: 'Đêm nhạc Acoustic Thu', status: 'PENDING_APPROVAL' } })
  })
  await page.getByRole('button', { name: 'Gửi Admin xét duyệt' }).click()
  await expect(page.getByRole('heading', { name: 'Đã gửi sự kiện chờ duyệt!' })).toBeVisible()
  expect(uploads).toBe(0)
})

test('changing or removing an image and leaving the draft never uploads it', async ({ page }) => {
  await session(page)
  let posts = 0
  page.on('request', request => { if (request.method() === 'POST' && new URL(request.url()).pathname.startsWith('/api/events')) posts++ })
  await page.goto('/organizer/events/new/details')
  await selectImage(page, 'bannerImage')
  await selectImage(page, 'bannerImage')
  await page.getByRole('button', { name: 'Xóa ảnh bìa / poster', exact: true }).click()
  await expect(page.getByRole('img', { name: 'Xem trước ảnh bìa / poster', exact: true })).toHaveCount(0)
  if (test.info().project.name === 'mobile') {
    await page.getByRole('button', { name: 'Mở menu điều hướng' }).click()
    await page.getByRole('navigation', { name: 'Menu Organizer' }).getByRole('link', { name: 'Tổng quan', exact: true }).click()
  } else {
    await page.getByRole('button', { name: 'Hủy bỏ thay đổi' }).click()
    await page.getByRole('button', { name: 'Hủy và về tổng quan' }).click()
  }
  await expect(page).toHaveURL('/organizer')
  expect(posts).toBe(0)
})
