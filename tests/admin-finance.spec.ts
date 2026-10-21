import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const organizer = { id: 2, fullName: 'Nhà tổ chức thử', email: 'finance@example.invalid' }
const pending = {
  id: 7, organizer, amount: 1000000, bankName: 'Ngân hàng thử', accountNumber: '0123456789',
  status: 'PENDING', requestedAt: '2026-10-12T01:00:00', processedBy: null, processedAt: null,
  rejectReason: null, transactionCode: null, payouts: [],
}
const list = <T>(items: T[], page = 0) => ({ items, page, pageSize: 20, totalElements: items.length, totalPages: items.length ? 1 : 0 })
async function login(page: Page, role = 'ADMIN') {
  await page.route('**/api/auth/refresh', route => route.fulfill({ json: { id: 1, fullName: 'Admin thử', email: 'admin@example.invalid', role } }))
}

test('overview shows API balances and unknown revenue on desktop and mobile', async ({ page }) => {
  await login(page)
  await page.route('**/api/admin/statistics', route => route.fulfill({ json: {
    totalEvents: 12, totalUsers: 34, totalTicketsSold: 56, pendingBalance: 100, availableBalance: 200,
    withdrawalPendingBalance: 300, totalWithdrawn: 400, grossRevenue: null, netRevenue: null,
    revenueUnavailableReason: 'Chưa có định nghĩa doanh thu.',
  } }))
  await page.goto('/admin/statistics')
  await expect(page.getByRole('heading', { name: 'Thống kê tổng quan' })).toBeVisible()
  await expect(page.getByText('Chưa xác định', { exact: true })).toHaveCount(2)
  await expect(page.getByText('Số dư khả dụng Organizer').locator('..')).toContainText('200')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width)
  await page.screenshot({ path: test.info().outputPath('finance-overview.png'), fullPage: true })
})
test('withdrawal list filters and links to detail without account number', async ({ page }) => {
  await login(page)
  await page.route('**/api/admin/withdrawal-requests?**', route => {
    const status = new URL(route.request().url()).searchParams.get('status')
    return route.fulfill({ json: list(status === 'REJECTED' ? [] : [{ ...pending, accountNumber: null }]) })
  })
  await page.goto('/admin/withdrawals')
  await expect(page.getByRole('link', { name: 'Xem #7' })).toHaveAttribute('href', '/admin/withdrawals/7')
  await expect(page.getByText(pending.accountNumber)).toHaveCount(0)
  await page.getByLabel('Trạng thái').selectOption('REJECTED')
  await expect(page).toHaveURL(/status=REJECTED/)
  await expect(page.getByText('Không có yêu cầu rút tiền phù hợp.')).toBeVisible()
})
test('approval requires transfer reference and sends one request', async ({ page }) => {
  await login(page)
  let approved = false, calls = 0
  await page.route('**/api/admin/withdrawal-requests/7', route => route.fulfill({ json: approved ? { ...pending, status: 'APPROVED', transactionCode: 'BANK-7', processedBy: 1, processedAt: '2026-10-12T02:00:00' } : pending }))
  await page.route('**/api/admin/withdrawal-requests/7/approve', async route => {
    calls++
    expect(route.request().postDataJSON()).toEqual({ transactionCode: 'BANK-7' })
    expect(route.request().headers()['x-csrf-protection']).toBe('1')
    await new Promise(resolve => setTimeout(resolve, 200))
    approved = true
    await route.fulfill({ json: { ...pending, status: 'APPROVED' } })
  })
  await page.goto('/admin/withdrawals/7')
  await page.getByRole('button', { name: 'Duyệt', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('button', { name: 'Xác nhận', exact: true })).toBeDisabled()
  await dialog.getByLabel('Mã giao dịch chuyển tiền').fill(' BANK-7 ')
  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await expect(dialog.getByRole('button', { name: 'Đang xử lý…' })).toBeDisabled()
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Duyệt', exact: true })).toHaveCount(0)
  await expect(page.getByRole('status')).toContainText('Đã ghi nhận chuyển khoản')
  expect(calls).toBe(1)
  await page.screenshot({ path: test.info().outputPath('withdrawal-approved.png'), fullPage: true })
})
test('rejection validates reason, cancel makes no mutation, and success refreshes detail', async ({ page }) => {
  await login(page)
  let rejected = false, calls = 0
  await page.route('**/api/admin/withdrawal-requests/7', route => route.fulfill({ json: rejected ? { ...pending, status: 'REJECTED', rejectReason: 'Sai ngân hàng' } : pending }))
  await page.route('**/api/admin/withdrawal-requests/7/reject', route => {
    calls++; rejected = true
    expect(route.request().postDataJSON()).toEqual({ reason: 'Sai ngân hàng' })
    return route.fulfill({ json: { ...pending, status: 'REJECTED' } })
  })
  await page.goto('/admin/withdrawals/7')
  await page.getByRole('button', { name: 'Từ chối', exact: true }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Hủy bỏ' }).click()
  expect(calls).toBe(0)
  await page.getByRole('button', { name: 'Từ chối', exact: true }).click()
  await page.getByLabel('Lý do từ chối', { exact: true }).fill('   ')
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true })).toBeDisabled()
  await page.getByLabel('Lý do từ chối', { exact: true }).fill('Sai ngân hàng')
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await expect(page.getByText('Sai ngân hàng', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Từ chối', exact: true })).toHaveCount(0)
  expect(calls).toBe(1)
})
test('failed decision keeps input and explains insufficient held balance', async ({ page }) => {
  await login(page)
  await page.route('**/api/admin/withdrawal-requests/7', route => route.fulfill({ json: pending }))
  await page.route('**/api/admin/withdrawal-requests/7/approve', route => route.fulfill({ status: 409, json: { code: 'INSUFFICIENT_RESERVED_BALANCE' } }))
  await page.goto('/admin/withdrawals/7')
  await page.getByRole('button', { name: 'Duyệt', exact: true }).click()
  await page.getByLabel('Mã giao dịch chuyển tiền').fill('BANK-7')
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Số dư chờ rút không đủ')
  await expect(page.getByLabel('Mã giao dịch chuyển tiền')).toHaveValue('BANK-7')
})
test('refund inspection shows actual history and never offers an unsupported transfer', async ({ page }) => {
  await login(page)
  await page.route('**/api/admin/refund-events/8?**', route => route.fulfill({ json: {
    eventId: 8, eventName: 'Sự kiện đã hủy thử', cancelReason: 'Thời tiết', canRefund: false,
    unavailableReason: 'Chưa tích hợp cổng hoàn tiền.', payments: list([{
      id: 9, bookingId: 10, customerName: 'Khách thử', paidAmount: 100000, paymentStatus: 'Provider status',
      paidAt: '2026-10-12T01:00:00', refundId: 11, refundAmount: 50000, refundStatus: 'Provider refund status',
      retryCount: 2, refundedAt: null,
    }]),
  } }))
  await page.goto('/admin/refunds/8')
  await expect(page.getByText('Chưa tích hợp cổng hoàn tiền.')).toBeVisible()
  await expect(page.getByText('Provider refund status')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Hoàn tiền', exact: true })).toHaveCount(0)
})
test('finance loading, error, retry, and non-admin routing work', async ({ page }) => {
  await login(page)
  let fail = true
  await page.route('**/api/admin/statistics', async route => {
    await new Promise(resolve => setTimeout(resolve, 200))
    await route.fulfill(fail ? { status: 500 } : { json: { totalEvents: 0, totalUsers: 0, totalTicketsSold: 0, pendingBalance: 0, availableBalance: 0, withdrawalPendingBalance: 0, totalWithdrawn: 0, grossRevenue: null, netRevenue: null, revenueUnavailableReason: 'Chưa xác định.' } })
  })
  await page.goto('/admin/statistics')
  await expect(page.getByRole('status')).toContainText('Đang tải dữ liệu')
  await expect(page.getByRole('alert')).toBeVisible()
  fail = false
  await page.getByRole('button', { name: 'Thử lại' }).click()
  await expect(page.getByText('Chưa xác định.', { exact: true })).toBeVisible()
  await login(page, 'CUSTOMER')
  await page.goto('/admin/withdrawals/7')
  await expect(page).not.toHaveURL('/admin/withdrawals/7')
})

test('lost approval response reloads committed status and prevents another decision', async ({ page }) => {
  await login(page)
  let approved = false, calls = 0
  await page.route('**/api/admin/withdrawal-requests/7', route => route.fulfill({ json: { ...pending, status: approved ? 'APPROVED' : 'PENDING' } }))
  await page.route('**/api/admin/withdrawal-requests/7/approve', route => {
    calls++; approved = true
    return route.abort('failed')
  })
  await page.goto('/admin/withdrawals/7')
  await page.getByRole('button', { name: 'Duyệt', exact: true }).click()
  await page.getByLabel('Mã giao dịch chuyển tiền').fill('BANK-7')
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await expect(page.getByText('Đã duyệt', { exact: true })).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true })).toBeDisabled()
  expect(calls).toBe(1)
})

test('concurrent payout discovered on reload blocks the still-open decision dialog', async ({ page }) => {
  await login(page)
  let hasPayout = false, calls = 0
  await page.route('**/api/admin/withdrawal-requests/7', route => route.fulfill({ json: { ...pending, payouts: hasPayout ? [{ id: 9, amount: 1000000, status: 'PENDING', transactionCode: null, failureReason: null, initiatedAt: null, completedAt: null }] : [] } }))
  await page.route('**/api/admin/withdrawal-requests/7/approve', route => {
    calls++; hasPayout = true
    return route.fulfill({ status: 409, json: { code: 'PAYOUT_REQUIRES_RECONCILIATION' } })
  })
  await page.goto('/admin/withdrawals/7')
  await page.getByRole('button', { name: 'Duyệt', exact: true }).click()
  await page.getByLabel('Mã giao dịch chuyển tiền').fill('BANK-7')
  await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true }).click()
  await expect(page.getByText('Yêu cầu đã có giao dịch chi trả, cần đối soát trước khi xử lý.')).toBeVisible()
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Xác nhận', exact: true })).toBeDisabled()
  expect(calls).toBe(1)
})
