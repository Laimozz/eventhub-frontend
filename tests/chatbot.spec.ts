import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

type Role = 'CUSTOMER' | 'ORGANIZER' | 'STAFF' | 'ADMIN'
const user = { id: 7, email: 'chat@example.test', fullName: 'Minh Anh', phone: null, role: 'CUSTOMER' as Role }
const conversation = { id: 41, title: 'Sự kiện dành cho tôi', createdAt: '2026-11-17T03:00:00', updatedAt: '2026-11-17T03:01:00' }
const question = { id: 81, role: 'user', content: 'Có sự kiện nào sắp diễn ra?', createdAt: '2026-11-17T03:00:00' }
const answer = { id: 82, role: 'assistant', content: '**EventHub** có các sự kiện đang bán vé.\n\n- Vé Standard: 100.000 ₫\n- Hãy kiểm tra thông tin trước khi đặt vé.', createdAt: '2026-11-17T03:01:00' }

async function setup(page: Page, role: Role | null = 'CUSTOMER') {
  const state = { available: true, fail: false, sends: [] as Record<string, unknown>[], items: [] as typeof conversation[], messages: [question, answer], delay: 0 }
  await page.addInitScript(() => {
    window.EventSource = class extends EventTarget { readyState = 1; close() { this.readyState = 2 } } as unknown as typeof EventSource
  })
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (!path.startsWith('/api/')) return route.continue()
    if (path === '/api/auth/refresh') return route.fulfill(role ? { json: { ...user, role } } : { status: 401, json: {} })
    if (path === '/api/ai/status') return route.fulfill({ json: { available: state.available } })
    if (path === '/api/ai/conversations') return route.fulfill({ json: state.items })
    if (path === '/api/ai/conversations/41') {
      if (route.request().method() === 'DELETE') { state.items = []; return route.fulfill({ status: 204 }) }
      return route.fulfill({ json: { conversation, messages: state.messages } })
    }
    if (path === '/api/ai/chat') {
      expect(route.request().headers()['x-csrf-protection']).toBe('1')
      const body = route.request().postDataJSON()
      state.sends.push(body)
      if (state.delay) await new Promise(resolve => setTimeout(resolve, state.delay))
      if (state.fail) return route.fulfill({ status: 503, json: { message: 'AI đang bận. Vui lòng thử lại.' } })
      state.items = [conversation]
      state.messages = [{ ...question, content: body.message }, answer]
      return route.fulfill({ json: {
        conversation, userMessage: state.messages[0], assistantMessage: answer,
        sources: [{ label: 'Trang dữ liệu liên quan', path: `/${role?.toLowerCase() === 'customer' ? 'customer/explore' : role?.toLowerCase()}` }],
        contextAt: '2026-11-17T03:01:00Z',
      } })
    }
    if (path.includes('/notifications/unread-count')) return route.fulfill({ json: 0 })
    if (path.includes('/public/events')) return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, page: 0, size: 12 } })
    if (path === '/api/categories') return route.fulfill({ json: [] })
    if (path === '/api/events/mine') return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0 } })
    if (path === '/api/staff/events') return route.fulfill({ json: [] })
    if (path.startsWith('/api/admin/events')) return route.fulfill({ json: { items: [], totalElements: 0, totalPages: 0 } })
    return route.fulfill({ json: {} })
  })
  return state
}

async function open(page: Page) {
  await page.getByRole('button', { name: 'Mở trợ lý EventHub AI', exact: true }).click()
  await expect(page.getByLabel('Câu hỏi cho trợ lý AI')).toBeEnabled()
}

test('anonymous visitors do not see the account assistant', async ({ page }) => {
  await setup(page, null)
  await page.goto('/customer/explore')
  await expect(page.getByRole('heading', { name: 'Kết quả tìm kiếm' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mở trợ lý EventHub AI' })).toHaveCount(0)
})

for (const [role, prompt, path] of [
  ['CUSTOMER', 'Khám phá sự kiện', '/customer/explore'],
  ['ORGANIZER', 'Tổng quan sự kiện', '/organizer/events'],
  ['STAFF', 'Lịch phân công', '/staff'],
  ['ADMIN', 'Tổng quan hệ thống', '/admin/events/pending'],
] as const) {
  test(`${role} can use role suggestions and receive a grounded answer`, async ({ page }) => {
    const state = await setup(page, role)
    await page.goto(path)
    await open(page)
    const dialog = page.getByRole('dialog', { name: 'EventHub AI' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: new RegExp(prompt) })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Gửi câu hỏi' })).toBeDisabled()
    expect(await dialog.evaluate(el => { const rect = el.getBoundingClientRect(); return rect.right <= innerWidth && rect.left >= 0 && rect.bottom <= innerHeight + 1 })).toBe(true)
    await expect(dialog.getByRole('heading', { level: 3 })).toBeVisible()
    await page.screenshot({ path: test.info().outputPath(`chat-${role}-welcome.png`), fullPage: false })
    await dialog.getByRole('button', { name: new RegExp(prompt) }).click()
    await expect(dialog.getByRole('article', { name: 'Trợ lý AI', exact: true })).toContainText('100.000 ₫')
    await expect(dialog.getByRole('link', { name: 'Trang dữ liệu liên quan' })).toBeVisible()
    expect(state.sends).toHaveLength(1)
    expect(Object.keys(state.sends[0]).sort()).toEqual(['conversationId', 'message'])
    await page.screenshot({ path: test.info().outputPath(`chat-${role}-answer.png`), fullPage: false })
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'Mở trợ lý EventHub AI' })).toBeFocused()
  })
}

test('provider errors preserve the question and retry without duplicate messages', async ({ page }) => {
  const state = await setup(page)
  state.fail = true
  await page.goto('/customer/explore')
  await open(page)
  const input = page.getByLabel('Câu hỏi cho trợ lý AI')
  await input.fill(question.content)
  await input.press('Enter')
  await expect(page.getByRole('alert')).toContainText('AI đang bận')
  await expect(input).toHaveValue(question.content)
  await expect(page.getByRole('article', { name: 'Bạn', exact: true })).toHaveCount(0)
  state.fail = false
  await page.getByRole('button', { name: 'Gửi câu hỏi', exact: true }).click()
  await expect(page.getByRole('article', { name: 'Trợ lý AI', exact: true })).toBeVisible()
  await expect(page.getByRole('article', { name: 'Bạn', exact: true })).toHaveCount(1)
  expect(state.sends).toHaveLength(2)
})

test('history persists across reload and can be opened and deleted', async ({ page }) => {
  const state = await setup(page)
  state.items = [conversation]
  await page.goto('/customer/explore')
  await open(page)
  await page.getByRole('button', { name: 'Lịch sử hội thoại', exact: true }).click()
  await page.getByRole('button', { name: /Sự kiện dành cho tôi/ }).first().click()
  await expect(page.getByRole('article', { name: 'Bạn', exact: true })).toContainText(question.content)
  await page.reload()
  await open(page)
  await page.getByRole('button', { name: 'Lịch sử hội thoại', exact: true }).click()
  await page.getByRole('button', { name: 'Xóa hội thoại Sự kiện dành cho tôi', exact: true }).click()
  await page.getByRole('button', { name: 'Giữ lại', exact: true }).click()
  expect(state.items).toHaveLength(1)
  await page.getByRole('button', { name: 'Xóa hội thoại Sự kiện dành cho tôi', exact: true }).click()
  await page.getByRole('button', { name: 'Xóa', exact: true }).click()
  await expect(page.getByText('Các hội thoại của bạn sẽ xuất hiện tại đây.')).toBeVisible()
  expect(state.items).toHaveLength(0)
})

test('unconfigured provider disables sending and keeps history available', async ({ page }) => {
  const state = await setup(page)
  state.available = false
  state.items = [conversation]
  await page.goto('/customer/explore')
  await page.getByRole('button', { name: 'Mở trợ lý EventHub AI' }).click()
  await expect(page.getByText('Trợ lý đang chờ được kích hoạt. Vui lòng quay lại sau.')).toBeVisible()
  await expect(page.getByLabel('Câu hỏi cho trợ lý AI')).toBeDisabled()
  await page.getByRole('button', { name: 'Lịch sử hội thoại', exact: true }).click()
  await expect(page.getByRole('button', { name: /Sự kiện dành cho tôi/ }).first()).toBeVisible()
  expect(state.sends).toHaveLength(0)
})

test('busy state prevents duplicate sends and Shift+Enter keeps a newline', async ({ page }) => {
  const state = await setup(page)
  state.delay = 400
  await page.goto('/customer/explore')
  await open(page)
  const input = page.getByLabel('Câu hỏi cho trợ lý AI')
  await input.fill('Dòng một')
  await input.press('Shift+Enter')
  await input.press('a')
  await expect(input).toHaveValue('Dòng một\na')
  await input.press('Enter')
  await expect(page.getByRole('button', { name: 'Gửi câu hỏi', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Hội thoại mới', exact: true })).toBeDisabled()
  await expect(page.getByRole('article', { name: 'Trợ lý AI', exact: true })).toBeVisible()
  expect(state.sends).toHaveLength(1)
})

test('AI markup cannot create scripts or unsafe links', async ({ page }) => {
  const state = await setup(page)
  state.items = [conversation]
  state.messages = [question, { ...answer, content: '<img src=x onerror=alert(1)>\n\n[unsafe](javascript:alert)\n\n[outside](https://example.test)\n\n**Thông tin an toàn**' }]
  await page.goto('/customer/explore')
  await open(page)
  await page.getByRole('button', { name: 'Lịch sử hội thoại', exact: true }).click()
  await page.getByRole('button', { name: /Sự kiện dành cho tôi/ }).first().click()
  const message = page.getByRole('article', { name: 'Trợ lý AI', exact: true })
  await expect(message).toContainText('<img src=x onerror=alert(1)>')
  await expect(message.locator('img, script, a')).toHaveCount(0)
  await expect(message.locator('strong')).toHaveText('Thông tin an toàn')
})
