import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const user = { id: 1, email: 'member@example.test', fullName: 'Nguyễn An', phone: '0901234567', role: 'CUSTOMER' }
const token = '8d05ac9a-5c4c-4d9f-8805-7e0d847720c2'
const poster = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="650"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#133b42"/><stop offset="1" stop-color="#174f28"/></linearGradient></defs><path fill="url(#g)" d="M0 0h800v650H0z"/><circle cx="560" cy="200" r="180" fill="#25bd7a" opacity=".15"/><text x="65" y="235" fill="#a5efd0" font-family="sans-serif" font-size="23" letter-spacing="9">EVENTHUB PRESENTS</text><text x="60" y="340" fill="white" font-family="sans-serif" font-size="72" font-weight="bold">LIVE MUSIC</text><text x="65" y="405" fill="#cce9d8" font-family="sans-serif" font-size="32">A NIGHT TO REMEMBER</text></svg>`
const event = { id: 11, name: 'Live Music · Đêm nhạc mùa thu', thumbnailImageUrl: '/test-poster.svg', status: 'APPROVED', startTime: '2026-12-20T12:00:00', endTime: '2026-12-20T16:00:00', city: 'TP. Hồ Chí Minh', address: 'Nhà hát Hòa Bình, 240 đường 3/2' }
const ticket = { id: 71, bookingId: 42, ticketCode: 'EH2026AUTUMN001', qrToken: token, status: 'VALID', checkedInAt: null, ticketTypeName: 'Standard', unitPrice: 250000, ownerName: user.fullName, canCheckIn: true, event }
function booking(status = 'PENDING', expiry = Date.now() + 14 * 60_000) {
  return { id: 42, status, totalAmount: 500000, currency: 'VND', createdAt: '2026-10-12T08:00:00', expiredAt: new Date(expiry).toISOString(), paymentConfirmationDeadline: status === 'PAYMENT_CONFIRMING' ? new Date(expiry + 120_000).toISOString() : null, event,
    items: [{ id: 1, ticketTypeId: 31, ticketTypeName: 'Standard', quantity: 2, unitPrice: 250000, subtotal: 500000, tickets: status === 'PAID' ? [ticket] : [] }],
    payments: status === 'PAID' ? [{ id: 1, transactionId: 'test-ref', gatewayTransactionId: '12345', paymentMethod: 'VNPAY', amount: 500000, status: 'SUCCESS', responseCode: '00', createdAt: '2026-10-12T08:00:00', paidAt: '2026-10-12T08:02:00' }] : [] }
}
const callbackUrl = '/customer/payment-result?vnp_TxnRef=test-ref&vnp_SecureHash=test-signature'
const pageResult = <T,>(items: T[], page = 0, totalPages = 1) => ({ items, page, size: 10, totalElements: items.length, totalPages })
async function setup(page: Page, role = 'CUSTOMER') {
  await page.route('**/test-poster.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: poster }))
  await page.route('**/api/auth/refresh', route => route.fulfill({ json: { ...user, role } }))
  await page.route('**/api/public/events/11', route => route.fulfill({ json: { ...event, description: 'Một đêm nhạc đáng nhớ.', bannerImageUrl: event.thumbnailImageUrl, imageZoneUrl: null, organizerName: 'EventHub Live', categoryName: 'Âm nhạc', venue: { city: event.city, address: event.address }, startingPrice: 250000, suggestedEvents: [] } }))
  await page.route('**/api/bookings/events/11/ticket-types', route => route.fulfill({ json: [
    { id: 31, name: 'Standard', description: 'Khu vực tiêu chuẩn', price: 250000, remainingQuantity: 5, bookable: true },
    { id: 32, name: 'VIP', price: 600000, remainingQuantity: 0, bookable: false },
  ] }))
  await page.route('**/api/bookings/42', route => route.fulfill({ json: booking() }))
}
async function screenshot(page: Page, name: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: test.info().outputPath(`${name}.png`), fullPage: true })
}

test('select tickets uses server stock, creates booking and redirects to checkout', async ({ page }) => {
  await setup(page)
  let creates = 0
  await page.route('**/api/bookings', async route => {
    creates++
    expect(route.request().postDataJSON()).toEqual({ eventId: 11, items: [{ ticketTypeId: 31, quantity: 2 }] })
    expect(route.request().headers()['x-csrf-protection']).toBe('1')
    await route.fulfill({ status: 201, json: booking() })
  })
  await page.goto('/customer/events/11/book')
  await expect(page.getByRole('button', { name: 'Tiếp tục (0 vé)' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Tăng VIP' })).toBeDisabled()
  await page.getByRole('button', { name: 'Tăng Standard' }).click({ clickCount: 2 })
  await expect(page.getByLabel('Số vé Standard')).toHaveText('2')
  await screenshot(page, 'select-tickets')
  await page.getByRole('button', { name: 'Tiếp tục (2 vé)' }).click()
  await expect(page).toHaveURL('/customer/bookings/42/checkout')
  await expect(page.getByLabel('Email tài khoản')).toHaveValue(user.email)
  await expect(page.getByRole('button', { name: 'Thanh toán qua VNPay' })).toBeDisabled()
  await screenshot(page, 'checkout')
  expect(creates).toBe(1)
})

test('stock conflict stays on selector and displays actionable error', async ({ page }) => {
  await setup(page)
  await page.route('**/api/bookings', route => route.fulfill({ status: 409, json: { message: 'Not enough tickets' } }))
  await page.goto('/customer/events/11/book')
  await page.getByRole('button', { name: 'Tăng Standard' }).click()
  await page.getByRole('button', { name: 'Tiếp tục (1 vé)' }).click()
  await expect(page.getByRole('alert')).toContainText('Số vé còn lại không đủ')
  await expect(page).toHaveURL('/customer/events/11/book')
})

test('checkout opens backend VNPay URL, while expired hold prevents payment', async ({ page }) => {
  await setup(page)
  await page.route('**/api/bookings/42/payments/vnpay', route => route.fulfill({ json: { bookingId: 42, paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=test-ref' } }))
  await page.route('https://sandbox.vnpayment.vn/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>VNPay test destination</h1>' }))
  await page.goto('/customer/bookings/42/checkout')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Thanh toán qua VNPay' }).click()
  await expect(page).toHaveURL(/https:\/\/sandbox.vnpayment.vn\/paymentv2\/vpcpay.html/)
  await page.route('**/api/bookings/42', route => route.fulfill({ json: booking('PENDING', Date.now() - 10_000) }))
  await page.goto('/customer/bookings/42/checkout')
  await page.getByRole('checkbox').check()
  await expect(page.getByRole('button', { name: 'Thanh toán qua VNPay' })).toBeDisabled()
  await expect(page.getByRole('status')).toContainText('Đã hết thời gian thanh toán')
  await page.reload()
  await expect(page.getByRole('status')).toContainText('Đã hết thời gian thanh toán')
})

test('payment callback waits for authoritative PAID then shows success and tickets', async ({ page }) => {
  await setup(page)
  await page.route('**/api/payments/vnpay/return?*', route => route.fulfill({ json: { bookingId: 42, bookingStatus: 'PENDING', paymentStatus: 'PENDING', responseCode: '00', transactionStatus: '00' } }))
  let confirmed = false
  await page.route('**/api/bookings/42', route => route.fulfill({ json: booking(confirmed ? 'PAID' : 'PENDING') }))
  await page.goto(callbackUrl)
  await expect(page.getByRole('heading', { name: 'Đang xác nhận thanh toán…' })).toBeVisible()
  await expect(page.getByText('Thanh toán thành công!', { exact: true })).toHaveCount(0)
  confirmed = true
  await expect(page.getByRole('heading', { name: 'Thanh toán thành công!' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Xem vé điện tử / QR' })).toHaveAttribute('href', '/customer/bookings/42/tickets')
  await screenshot(page, 'payment-success')
})

test('failed or invalid callback never shows payment success', async ({ page }) => {
  await setup(page)
  await page.route('**/api/payments/vnpay/return?*', route => route.fulfill({ json: { bookingId: 42, bookingStatus: 'PENDING', paymentStatus: 'FAILED', responseCode: '24', transactionStatus: '02' } }))
  await page.goto(callbackUrl)
  await expect(page.getByRole('heading', { name: 'Thanh toán chưa hoàn tất' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Thử thanh toán lại' })).toBeVisible()
  await page.route('**/api/payments/vnpay/return?*', route => route.fulfill({ status: 400, json: { message: 'Invalid signature' } }))
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('Không thể xác thực kết quả VNPay')
  await expect(page.getByText('Thanh toán thành công!', { exact: true })).toHaveCount(0)
})

test('payment result keeps polling beyond 60 seconds during grace and receives tickets', async ({ page }) => {
  await setup(page)
  await page.clock.install()
  const expiry = Date.now() - 1000
  let paid = false
  let reads = 0
  await page.route('**/api/payments/vnpay/return?*', route => route.fulfill({ json: { bookingId: 42, bookingStatus: 'PAYMENT_CONFIRMING', paymentStatus: 'PENDING', responseCode: '00', transactionStatus: '00' } }))
  await page.route('**/api/bookings/42', route => { reads++; return route.fulfill({ json: booking(paid ? 'PAID' : 'PAYMENT_CONFIRMING', expiry) }) })
  await page.goto(callbackUrl)
  await expect(page.getByRole('heading', { name: 'Đang xác nhận thanh toán…' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('Vé đang được giữ')
  await expect(page.getByRole('link', { name: 'Thử thanh toán lại' })).toHaveCount(0)
  const before = reads
  await page.clock.fastForward(65_000)
  await expect.poll(() => reads).toBeGreaterThan(before)
  await expect(page.getByRole('heading', { name: 'Đang xác nhận thanh toán…' })).toBeVisible()
  await screenshot(page, 'payment-confirming')
  paid = true
  await page.clock.fastForward(2500)
  await expect(page.getByRole('heading', { name: 'Thanh toán thành công!' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Xem vé điện tử / QR' })).toBeVisible()
})

test('payment result shows expiry after grace and can refresh a late review', async ({ page }) => {
  await setup(page)
  await page.clock.install()
  const expiry = Date.now() - 119_000
  let status = 'PAYMENT_CONFIRMING'
  await page.route('**/api/payments/vnpay/return?*', route => route.fulfill({ json: { bookingId: 42, bookingStatus: status, paymentStatus: 'PENDING', responseCode: '00', transactionStatus: '00' } }))
  await page.route('**/api/bookings/42', route => route.fulfill({ json: booking(status, expiry) }))
  await page.goto(callbackUrl)
  await expect(page.getByRole('heading', { name: 'Đang xác nhận thanh toán…' })).toBeVisible()
  status = 'EXPIRED'
  await page.clock.fastForward(2500)
  await expect(page.getByRole('heading', { name: 'Booking đã hết hạn' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Xem vé điện tử / QR' })).toHaveCount(0)
  status = 'PAYMENT_REVIEW'
  await page.getByRole('button', { name: 'Kiểm tra lại' }).click()
  await expect(page.getByRole('heading', { name: 'Thanh toán đang được đối soát' })).toBeVisible()
})

test('checkout enters confirmation grace automatically and cannot charge again', async ({ page }) => {
  await setup(page)
  await page.clock.install()
  const expiry = Date.now() + 1000
  let status = 'PENDING'
  await page.route('**/api/bookings/42', route => route.fulfill({ json: { ...booking(status, expiry), paymentConfirmationDeadline: new Date(expiry + 120_000).toISOString() } }))
  await page.goto('/customer/bookings/42/checkout')
  await page.getByRole('checkbox').check()
  status = 'PAYMENT_CONFIRMING'
  await page.clock.fastForward(6000)
  await expect(page.getByRole('status')).toContainText('Đang xác nhận thanh toán')
  await expect(page.getByRole('button', { name: 'Thanh toán qua VNPay' })).toBeDisabled()
  await expect(page.getByRole('link', { name: 'Chọn vé lại' })).toHaveCount(0)
  status = 'PAID'
  await page.clock.fastForward(6000)
  await expect(page.getByText('Đã thanh toán', { exact: true })).toBeVisible()
})

test('history and detail display confirmation grace without offering another payment', async ({ page }) => {
  await setup(page)
  const expiry = Date.now() - 20_000
  let status = 'PAYMENT_CONFIRMING'
  await page.route('**/api/bookings?*', route => route.fulfill({ json: pageResult([booking(status, expiry)]) }))
  await page.route('**/api/bookings/42', route => route.fulfill({ json: booking(status, expiry) }))
  await page.goto('/customer/booking-cua-toi')
  await expect(page.getByText('Đang xác nhận thanh toán', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Tiếp tục thanh toán' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Xem chi tiết booking' }).click()
  await expect(page.getByRole('status')).toContainText('Đang xác nhận thanh toán')
  await expect(page.getByRole('link', { name: 'Tiếp tục thanh toán' })).toHaveCount(0)
  status = 'PAID'
  await expect(page.getByRole('link', { name: 'Xem vé điện tử / QR' })).toBeVisible({ timeout: 10000 })
})

test('anonymous checkout resumes after login at the original booking', async ({ page }) => {
  await setup(page)
  await page.route('**/api/auth/refresh', route => route.fulfill({ status: 401, json: {} }))
  await page.route('**/api/auth/login', route => route.fulfill({ json: user }))
  await page.goto('/customer/bookings/42/checkout')
  await expect(page).toHaveURL('/login')
  await page.getByLabel('Email', { exact: false }).fill(user.email)
  await page.locator('input[name="password"]').fill('Test-password-123')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page).toHaveURL('/customer/bookings/42/checkout')
})

test('history pagination and booking detail render backend prices and payment', async ({ page }) => {
  await setup(page)
  await page.route('**/api/bookings?*', route => {
    const index = Number(new URL(route.request().url()).searchParams.get('page'))
    return route.fulfill({ json: pageResult([booking(index ? 'PENDING' : 'PAID')], index, 2) })
  })
  await page.route('**/api/bookings/42', route => route.fulfill({ json: booking('PAID') }))
  await page.goto('/customer/booking-cua-toi')
  await expect(page.getByText('Đã thanh toán', { exact: true })).toBeVisible()
  await screenshot(page, 'booking-history')
  await page.getByRole('button', { name: 'Trang sau' }).click()
  await expect(page).toHaveURL(/page=1/)
  await expect(page.getByRole('link', { name: 'Tiếp tục thanh toán' })).toBeVisible()
  await page.getByRole('link', { name: 'Xem chi tiết booking' }).click()
  await expect(page.getByRole('heading', { name: /Chi tiết booking/ })).toBeVisible()
  await expect(page.getByText('Standard', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Xem vé/ })).toBeVisible()
  await screenshot(page, 'booking-detail')
})

test('ticket QR renders, enlarges and disappears after server marks USED', async ({ page }) => {
  await setup(page)
  let used = false
  await page.route('**/api/tickets?*', route => route.fulfill({ json: pageResult([{ ...ticket, ...(used ? { status: 'USED', qrToken: null, canCheckIn: false, checkedInAt: '2026-12-20T12:01:00' } : {}) }]) }))
  await page.goto('/customer/ve-cua-toi')
  const qr = page.locator('svg').filter({ has: page.locator('title', { hasText: `QR vé ${ticket.ticketCode}` }) })
  await expect(qr).toBeVisible()
  await screenshot(page, 'electronic-tickets')
  await page.getByRole('button', { name: 'Phóng to mã QR' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await screenshot(page, 'qr-enlarged')
  used = true
  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await expect(page.getByText('Vé đã được sử dụng')).toBeVisible()
  await expect(page.locator('svg title')).toHaveCount(0)
})

test('free booking goes directly to issued tickets without a payment request', async ({ page }) => {
  await setup(page)
  const freeBooking = { ...booking('PAID'), totalAmount: 0, items: [{ ...booking('PAID').items[0], unitPrice: 0, subtotal: 0 }], payments: [{ ...booking('PAID').payments[0], paymentMethod: 'FREE', amount: 0 }] }
  await page.route('**/api/bookings', route => route.fulfill({ status: 201, json: freeBooking }))
  await page.route('**/api/bookings/42', route => route.fulfill({ json: freeBooking }))
  let payments = 0
  await page.route('**/api/bookings/42/payments/vnpay', route => { payments++; return route.fulfill({ status: 500 }) })
  await page.goto('/customer/events/11/book')
  await page.getByRole('button', { name: 'Tăng Standard' }).click()
  await page.getByRole('button', { name: 'Tiếp tục (1 vé)' }).click()
  await expect(page.getByRole('heading', { name: 'Đặt vé thành công!' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Xem vé điện tử / QR' })).toBeVisible()
  expect(payments).toBe(0)
})

test('late payment review does not offer QR or display payment success', async ({ page }) => {
  await setup(page)
  await page.route('**/api/payments/vnpay/return?*', route => route.fulfill({ json: { bookingId: 42, bookingStatus: 'PAYMENT_REVIEW', paymentStatus: 'SUCCESS', responseCode: '00', transactionStatus: '00' } }))
  await page.route('**/api/bookings/42', route => route.fulfill({ json: booking('PAYMENT_REVIEW') }))
  await page.goto(callbackUrl)
  await expect(page.getByRole('heading', { name: 'Thanh toán đang được đối soát' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Xem vé điện tử / QR' })).toHaveCount(0)
  await expect(page.getByText('Thanh toán thành công!', { exact: true })).toHaveCount(0)
})

