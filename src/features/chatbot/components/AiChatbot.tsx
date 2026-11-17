import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowDown, ArrowRight, Check, ChevronLeft, Copy, History, LoaderCircle,
  Maximize2, MessageCircle, Minimize2, Plus, Send, ShieldCheck, Sparkles, Trash2, X,
} from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth'
import type { User } from '../../auth/types/auth'
import { ApiError } from '../../../lib/http-client'
import * as api from '../api/chatbot-api'
import type { ChatMessage, ChatSource, Conversation } from '../api/chatbot-api'
import { ChatContent } from './ChatContent'
import styles from './AiChatbot.module.css'

const roleContent = {
  CUSTOMER: {
    label: 'Khách hàng', title: 'Trải nghiệm tiếp theo\ncủa bạn là gì?',
    description: 'Khám phá sự kiện, tìm hiểu giá vé và theo dõi đơn đặt vé của bạn.',
    prompts: [
      ['Khám phá sự kiện', 'Gợi ý cho tôi những sự kiện sắp diễn ra còn bán vé.'],
      ['Đơn vé của tôi', 'Các đơn đặt vé gần đây của tôi có trạng thái như thế nào?'],
      ['Hướng dẫn đặt vé', 'Hướng dẫn tôi cách đặt vé và thanh toán trên EventHub.'],
      ['Thông tin hoàn tiền', 'Làm sao để kiểm tra hoàn tiền khi sự kiện bị hủy?'],
    ],
  },
  ORGANIZER: {
    label: 'Nhà tổ chức', title: 'Cùng tạo nên\nsự kiện đáng nhớ.',
    description: 'Nắm bắt tình hình sự kiện, doanh thu và số dư ví của bạn.',
    prompts: [
      ['Tổng quan sự kiện', 'Tóm tắt tình trạng các sự kiện của tôi.'],
      ['Ví & doanh thu', 'Số dư ví và các yêu cầu rút tiền gần đây của tôi như thế nào?'],
      ['Theo dõi bán vé', 'Tình hình bán vé các sự kiện của tôi như thế nào?'],
      ['Gửi duyệt sự kiện', 'Hướng dẫn tạo sự kiện và gửi Admin xét duyệt.'],
    ],
  },
  STAFF: {
    label: 'Nhân viên', title: 'Sẵn sàng cho\nca làm hôm nay?',
    description: 'Tra cứu sự kiện được phân công và thông tin soát vé tại một nơi.',
    prompts: [
      ['Lịch phân công', 'Tôi đang được phân công làm việc tại những sự kiện nào?'],
      ['Tiến độ check-in', 'Thống kê vé và check-in của các sự kiện được phân công cho tôi.'],
      ['Quy trình soát vé', 'Hướng dẫn quy trình check-in vé trên cổng Staff.'],
      ['Trạng thái vé', 'Các trạng thái VALID, USED, CANCELED của vé có ý nghĩa gì?'],
    ],
  },
  ADMIN: {
    label: 'Quản trị viên', title: 'Toàn cảnh EventHub,\ntrong một cuộc trò chuyện.',
    description: 'Theo dõi hệ thống, hàng chờ xét duyệt và các chỉ số tổng hợp.',
    prompts: [
      ['Tổng quan hệ thống', 'Tóm tắt các số liệu tổng quan của EventHub hiện tại.'],
      ['Sự kiện chờ duyệt', 'Có bao nhiêu sự kiện đang chờ duyệt? Liệt kê các hồ sơ chờ lâu nhất.'],
      ['Tài chính & hoàn tiền', 'Tổng doanh thu, số tiền đã hoàn và số yêu cầu rút tiền đang chờ là bao nhiêu?'],
      ['Người dùng', 'Thống kê người dùng theo vai trò và trạng thái tài khoản.'],
    ],
  },
} as const

function errorMessage(cause: unknown) {
  if (cause instanceof ApiError) return cause.data?.message || 'Không thể tải trợ lý AI. Vui lòng thử lại.'
  return 'Kết nối bị gián đoạn hoặc AI phản hồi quá lâu. Vui lòng thử lại.'
}

function time(value: string) {
  const date = new Date(value.endsWith('Z') || /[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function AiChatbot() {
  const { user, loading } = useAuth()
  return user && !loading ? <ChatSession key={`${user.id}-${user.role}`} user={user} /> : null
}

function ChatSession({ user }: { user: User }) {
  const content = roleContent[user.role]
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [history, setHistory] = useState<Conversation[]>([])
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sources, setSources] = useState<ChatSource[]>([])
  const [contextAt, setContextAt] = useState('')
  const [draft, setDraft] = useState('')
  const [pendingQuestion, setPendingQuestion] = useState('')
  const [busy, setBusy] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [showScroll, setShowScroll] = useState(false)
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 600px)').matches)
  const panel = useRef<HTMLElement>(null)
  const wasOpen = useRef(false)
  const launcher = useRef<HTMLButtonElement>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const scroll = useRef<HTMLDivElement>(null)
  const request = useRef<AbortController | null>(null)
  const metaRequest = useRef<AbortController | null>(null)
  const sending = useRef(false)

  useEffect(() => () => { request.current?.abort(); metaRequest.current?.abort() }, [])

  useEffect(() => {
    const query = window.matchMedia('(max-width: 600px)')
    const changed = () => setMobile(query.matches)
    query.addEventListener('change', changed)
    return () => query.removeEventListener('change', changed)
  }, [])

  useEffect(() => {
    if (!open || !mobile) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open, mobile])

  useEffect(() => {
    if (open) wasOpen.current = true
    else if (wasOpen.current) {
      wasOpen.current = false
      launcher.current?.focus({ preventScroll: true })
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    metaRequest.current = controller
    api.loadChat(controller.signal).then(result => {
      if (controller.signal.aborted) return
      setAvailable(result.available)
      setHistory(result.history)
    }).catch(cause => {
      if (!controller.signal.aborted) setError(errorMessage(cause))
    }).finally(() => {
      if (!controller.signal.aborted) setFetching(false)
    })
    return () => controller.abort()
  }, [open])

  useEffect(() => {
    if (!open || view !== 'chat') return
    const top = messages.length || pendingQuestion ? scroll.current?.scrollHeight ?? 0 : 0
    scroll.current?.scrollTo({ top, behavior: 'auto' })
  }, [messages, pendingQuestion, open, view])

  useEffect(() => {
    if (open && view === 'chat' && !busy && !fetching) {
      if (mobile) panel.current?.focus({ preventScroll: true })
      else textarea.current?.focus({ preventScroll: true })
    }
  }, [open, view, busy, fetching, mobile])

  function close() {
    setOpen(false)
  }

  function fresh() {
    if (busy) return
    request.current?.abort()
    setFetching(false)
    setConversationId(null)
    setMessages([])
    setSources([])
    setContextAt('')
    setDraft('')
    setError('')
    setDeleting(null)
    setView('chat')
  }

  async function selectConversation(id: number) {
    if (busy || fetching) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setFetching(true)
    setError('')
    try {
      const result = await api.loadConversation(id, controller.signal)
      if (controller.signal.aborted) return
      setConversationId(result.conversation.id)
      setMessages(result.messages)
      setSources([])
      setContextAt('')
      setDraft('')
      setView('chat')
      setDeleting(null)
    } catch (cause) {
      if (!controller.signal.aborted) setError(errorMessage(cause))
    } finally {
      if (!controller.signal.aborted) setFetching(false)
    }
  }

  async function send(question = draft) {
    const value = question.trim()
    if (!value || value.length > 2000 || sending.current || fetching || !available) return
    sending.current = true
    const controller = new AbortController()
    request.current = controller
    setBusy(true)
    setError('')
    setDraft('')
    setPendingQuestion(value)
    setSources([])
    try {
      const result = await api.sendChat(value, conversationId, controller.signal)
      if (controller.signal.aborted) return
      setConversationId(result.conversation.id)
      setMessages(current => [...current, result.userMessage, result.assistantMessage])
      setHistory(current => [result.conversation, ...current.filter(item => item.id !== result.conversation.id)].slice(0, 50))
      setSources(result.sources)
      setContextAt(result.contextAt)
    } catch (cause) {
      if (!controller.signal.aborted) {
        setDraft(value)
        setError(errorMessage(cause))
      }
    } finally {
      sending.current = false
      if (!controller.signal.aborted) { setBusy(false); setPendingQuestion('') }
    }
  }

  async function remove(id: number) {
    if (busy || fetching) return
    const controller = new AbortController()
    request.current = controller
    setFetching(true)
    setError('')
    try {
      await api.deleteConversation(id, controller.signal)
      if (controller.signal.aborted) return
      setHistory(current => current.filter(item => item.id !== id))
      if (conversationId === id) { setConversationId(null); setMessages([]); setSources([]); setContextAt('') }
      setDeleting(null)
    } catch (cause) {
      if (!controller.signal.aborted) setError(errorMessage(cause))
    } finally {
      if (!controller.signal.aborted) setFetching(false)
    }
  }

  async function copy(message: ChatMessage) {
    try { await navigator.clipboard.writeText(message.content); setCopied(message.id) }
    catch { setError('Chưa thể sao chép. Bạn có thể chọn nội dung tin nhắn để sao chép.') }
  }

  const disabled = busy || fetching || !available
  return <div className={styles.root}>
    {open && <section ref={panel} tabIndex={-1} id="eventhub-ai" role="dialog" aria-modal={mobile} aria-labelledby="eventhub-ai-title"
      className={`${styles.panel} ${expanded ? styles.expanded : ''}`}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.stopPropagation(); close() }
        if (mobile && event.key === 'Tab') {
          const focusable = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], textarea:not(:disabled)') ?? [])
            .filter(element => element.getClientRects().length > 0)
          const first = focusable[0], last = focusable.at(-1)
          if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus() }
          else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first?.focus() }
        }
      }}>
      <header className={styles.header}>
        <div className={styles.identity}><span className={styles.brandIcon}><Sparkles size={23} /></span>
          <div><h2 id="eventhub-ai-title">EventHub <span>AI</span></h2><p><i className={available ? styles.online : ''} />{available === null ? 'Đang kết nối' : available ? 'Trợ lý sự kiện của bạn' : 'Chưa sẵn sàng'}</p></div>
        </div>
        <div className={styles.headerActions}>
          <button title="Hội thoại mới" aria-label="Hội thoại mới" onClick={fresh} disabled={busy || fetching}><Plus size={19} /></button>
          <button title="Lịch sử hội thoại" aria-label="Lịch sử hội thoại" aria-pressed={view === 'history'} disabled={busy || fetching} onClick={() => { setView(view === 'history' ? 'chat' : 'history'); setDeleting(null); setError('') }}><History size={18} /></button>
          <button className={styles.expandButton} title={expanded ? 'Thu nhỏ' : 'Mở rộng'} aria-label={expanded ? 'Thu nhỏ' : 'Mở rộng'} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
          <button title="Đóng trợ lý" aria-label="Đóng trợ lý" onClick={close}><X size={20} /></button>
        </div>
      </header>
      <div className={styles.scope}><ShieldCheck size={14} /><span>Không gian dành cho <strong>{content.label}</strong></span><span className={styles.privateTag}>Riêng tư</span></div>

      {view === 'history' ? <div className={styles.history}>
        <div className={styles.historyHeading}><div><h3>Lịch sử trò chuyện</h3><p>50 hội thoại gần nhất của bạn</p></div><button aria-label="Quay lại trò chuyện" onClick={() => setView('chat')}><ChevronLeft size={20} /></button></div>
        {fetching && <p className={styles.loading} role="status"><LoaderCircle size={17} className={styles.spin} /> Đang tải…</p>}
        {!fetching && history.length === 0 && <div className={styles.emptyHistory}><History size={32} /><strong>Mọi ý tưởng bắt đầu từ một câu hỏi</strong><p>Các hội thoại của bạn sẽ xuất hiện tại đây.</p><button onClick={fresh}>Bắt đầu trò chuyện <ArrowRight size={15} /></button></div>}
        {history.map(item => <div className={`${styles.historyItem} ${item.id === conversationId ? styles.selected : ''}`} key={item.id}>
          <button className={styles.historySelect} disabled={fetching} onClick={() => void selectConversation(item.id)}><MessageCircle size={18} /><span><strong>{item.title || 'Cuộc trò chuyện'}</strong><small>{new Date(item.updatedAt + 'Z').toLocaleDateString('vi-VN')}</small></span></button>
          {deleting === item.id ? <div className={styles.deleteConfirm}><span>Xóa hội thoại này?</span><button disabled={fetching} onClick={() => void remove(item.id)}>Xóa</button><button disabled={fetching} onClick={() => setDeleting(null)}>Giữ lại</button></div>
            : <button className={styles.deleteButton} aria-label={`Xóa hội thoại ${item.title}`} disabled={fetching} onClick={() => setDeleting(item.id)}><Trash2 size={15} /></button>}
        </div>)}
      </div> : <>
        <div className={styles.messages} ref={scroll} role="log" aria-label="Tin nhắn với trợ lý AI" aria-live="polite" aria-relevant="additions"
          onScroll={() => { const el = scroll.current; if (el) setShowScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 120) }}>
          {messages.length === 0 && !pendingQuestion && <div className={styles.welcome}>
            <div className={styles.welcomeMark}><Sparkles size={31} /><span className={styles.orbit}>✦</span></div>
            <span className={styles.eyebrow}>MỘT CHÚT AI. THÊM NHIỀU CẢM HỨNG.</span>
            <h3>{content.title}</h3><p>{content.description}</p>
            <div className={styles.prompts}>{content.prompts.map(([label, question], index) => <button key={label} title={question} disabled={disabled} onClick={() => void send(question)}>
              <span className={styles.promptNumber}>0{index + 1}</span><strong>{label}</strong><ArrowRight size={16} /><small>{question}</small>
            </button>)}</div>
          </div>}
          {messages.map(message => <article key={message.id} className={message.role === 'user' ? styles.userMessage : styles.assistantMessage} aria-label={message.role === 'user' ? 'Bạn' : 'Trợ lý AI'}>
            {message.role === 'assistant' && <span className={styles.messageAvatar}><Sparkles size={16} /></span>}
            <div className={styles.messageBody}><div className={styles.bubble}><ChatContent text={message.content} /></div>
              <div className={styles.messageMeta}><span>{message.role === 'assistant' ? 'EventHub AI · ' : ''}{time(message.createdAt)}</span>
                {message.role === 'assistant' && <button aria-label="Sao chép câu trả lời" onClick={() => void copy(message)}>{copied === message.id ? <Check size={13} /> : <Copy size={13} />}{copied === message.id ? 'Đã sao chép' : 'Sao chép'}</button>}
              </div></div>
          </article>)}
          {pendingQuestion && <><article className={styles.userMessage} aria-label="Bạn"><div className={styles.messageBody}><div className={styles.bubble}><p>{pendingQuestion}</p></div></div></article>
            <div className={styles.thinking} role="status"><span className={styles.messageAvatar}><Sparkles size={16} /></span><span className={styles.dots}><i /><i /><i /></span><span>Đang tìm câu trả lời cho bạn</span></div></>}
          {sources.length > 0 && <div className={styles.sources}><span><ShieldCheck size={13} /> Trang dữ liệu liên quan {contextAt && `· ${time(contextAt)}`}</span><div>{sources.map(source => <Link key={source.path} to={source.path} onClick={close}>{source.label}<ArrowRight size={12} /></Link>)}</div></div>}
          {fetching && <p className={styles.loading} role="status"><LoaderCircle size={17} className={styles.spin} /> Đang tải trợ lý…</p>}
        </div>
        {showScroll && <button className={styles.scrollButton} aria-label="Đến tin nhắn mới nhất" onClick={() => scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: 'smooth' })}><ArrowDown size={16} /></button>}
      </>}
      {error && <div className={styles.error} role="alert"><span>{error}</span><button aria-label="Đóng thông báo lỗi" onClick={() => setError('')}><X size={15} /></button>{available === null && <button onClick={() => { setOpen(false); setError('') }}>Đóng và thử lại</button>}</div>}
      {available === false && <div className={styles.unavailable}>Trợ lý đang chờ được kích hoạt. Vui lòng quay lại sau.</div>}
      {view === 'chat' && <footer className={styles.footer}>
        <form className={styles.composer} onSubmit={event => { event.preventDefault(); void send() }}>
          <label className={styles.srOnly} htmlFor="eventhub-ai-question">Câu hỏi cho trợ lý AI</label>
          <textarea id="eventhub-ai-question" ref={textarea} rows={2} maxLength={2000} value={draft} disabled={disabled} placeholder="Hỏi EventHub AI bất cứ điều gì…"
            onChange={event => setDraft(event.target.value)} onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send() }
            }} />
          <div className={styles.composerBottom}><span><Sparkles size={12} /> Trợ lý EventHub</span><span>{draft.length > 1600 && `${draft.length}/2000`}<button type="submit" aria-label="Gửi câu hỏi" disabled={disabled || !draft.trim()}>{busy ? <LoaderCircle size={17} className={styles.spin} /> : <Send size={17} />}</button></span></div>
        </form>
        <p className={styles.disclaimer}>AI có thể nhầm lẫn. Hãy kiểm tra thông tin trước khi quyết định.</p>
      </footer>}
    </section>}
    <button ref={launcher} className={`${styles.launcher} ${open ? styles.launcherOpen : ''}`} aria-label={open ? 'Ẩn trợ lý EventHub AI' : 'Mở trợ lý EventHub AI'} aria-expanded={open} aria-controls="eventhub-ai" onClick={() => { if (open) close(); else { setFetching(true); setOpen(true) } }}>
      {open ? <X size={22} /> : <><span className={styles.launcherIcon}><Sparkles size={22} /></span><span>Hỏi EventHub AI<small>Luôn sẵn sàng hỗ trợ bạn</small></span><span className={styles.launcherDot} /></>}
    </button>
  </div>
}
