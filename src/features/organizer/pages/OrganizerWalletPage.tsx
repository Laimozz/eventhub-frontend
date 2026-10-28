import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Hourglass,
  Info,
  PlusCircle,
  Printer,
  Search,
  Wallet,
  X,
} from 'lucide-react'
import { ApiError } from '../../../lib/http-client'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  cancelWithdrawal,
  createWithdrawal,
  getOrganizerRevenue,
  getOrganizerWallet,
  getWithdrawalDetail,
  getWithdrawals,
  previewWithdrawal,
} from '../api/organizer-api'
import type {
  OrganizerRevenueSummary,
  OrganizerWallet,
  WithdrawalPreview,
  WithdrawalRequestItem,
} from '../types/organizer'
import styles from './OrganizerWalletPage.module.css'

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr.slice(0, 10)
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return String(dateStr).slice(0, 10)
  }
}

function formatDateTime(dateStr?: string | null) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return String(dateStr)
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return String(dateStr)
  }
}

function renderStatusBadge(status?: string) {
  const s = (status || '').toUpperCase()
  if (s === 'PENDING') {
    return <span className={styles.badgePending}>Chờ duyệt</span>
  }
  if (s === 'APPROVED') {
    return <span className={styles.badgeApproved}>Đã duyệt &amp; Chi</span>
  }
  if (s === 'REJECTED') {
    return <span className={styles.badgeRejected}>Bị từ chối</span>
  }
  if (s === 'CANCELLED' || s === 'CANCELED') {
    return <span className={styles.badgeCanceled}>Đã hủy</span>
  }
  return <span className={styles.badgePending}>{status || 'Chờ duyệt'}</span>
}

export function OrganizerWalletPage() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<OrganizerWallet | null>(null)
  const [revenue, setRevenue] = useState<OrganizerRevenueSummary | null>(null)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestItem[]>([])
  const [allWithdrawals, setAllWithdrawals] = useState<WithdrawalRequestItem[]>([])
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequestItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // UC 27 Detail Modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // UC 25 Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStep, setModalStep] = useState<'INPUT' | 'CONFIRM'>('INPUT')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankName, setBankName] = useState('Vietcombank')
  const [accountNumber, setAccountNumber] = useState('')
  const [previewData, setPreviewData] = useState<WithdrawalPreview | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 4000)
  }

  useEffect(() => {
    let ignore = false

    async function loadData() {
      try {
        setLoading(true)
        const [walletRes, revenueRes, listRes, allListRes] = await Promise.all([
          getOrganizerWallet().catch(() => null),
          getOrganizerRevenue().catch(() => null),
          getWithdrawals(statusFilter || undefined).catch(() => []),
          statusFilter ? getWithdrawals().catch(() => []) : Promise.resolve(null),
        ])

        if (ignore) return

        if (walletRes) setWallet(walletRes)
        if (revenueRes) setRevenue(revenueRes)
        setWithdrawals(listRes)
        if (allListRes) {
          setAllWithdrawals(allListRes)
        } else {
          setAllWithdrawals(listRes)
        }

        if (listRes.length > 0) {
          setSelectedWithdrawal((prev) => {
            if (prev && listRes.some((w) => w.id === prev.id)) {
              return listRes.find((w) => w.id === prev.id) || listRes[0]
            }
            return listRes[0]
          })
        } else {
          setSelectedWithdrawal(null)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    void loadData()

    return () => {
      ignore = true
    }
  }, [statusFilter])

  // UC 27: Select withdrawal & fetch detailed response
  async function handleSelectWithdrawal(id: number, openModal = false) {
    try {
      setDetailLoading(true)
      const detail = await getWithdrawalDetail(id)
      setSelectedWithdrawal(detail)
      if (openModal) {
        setIsDetailModalOpen(true)
      }
    } catch {
      const fallback = withdrawals.find((w) => w.id === id)
      if (fallback) setSelectedWithdrawal(fallback)
      if (openModal) setIsDetailModalOpen(true)
    } finally {
      setDetailLoading(false)
    }
  }

  function handleOpenCreateModal() {
    setModalStep('INPUT')
    setWithdrawAmount('')
    setAccountNumber('')
    setModalError('')
    setPreviewData(null)
    setIsModalOpen(true)
  }

  async function handleProceedToConfirm(e: React.FormEvent) {
    e.preventDefault()
    const amountNum = Number(withdrawAmount)
    if (!amountNum || amountNum <= 0) {
      setModalError('Vui lòng nhập số tiền hợp lệ lớn hơn 0.')
      return
    }
    if (!accountNumber.trim()) {
      setModalError('Vui lòng nhập số tài khoản ngân hàng.')
      return
    }
    if (wallet && amountNum > wallet.availableBalance) {
      setModalError('Số tiền rút vượt quá số dư khả dụng.')
      return
    }

    try {
      setModalLoading(true)
      setModalError('')
      const preview = await previewWithdrawal({
        amount: amountNum,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
      })
      setPreviewData(preview)
      setModalStep('CONFIRM')
    } catch (cause) {
      if (cause instanceof ApiError && cause.data?.message) {
        setModalError(cause.data.message)
      } else {
        setModalError('Số tiền rút không hợp lệ hoặc vượt quá số dư khả dụng.')
      }
    } finally {
      setModalLoading(false)
    }
  }

  async function handleConfirmSubmit() {
    if (!previewData) return

    try {
      setModalLoading(true)
      setModalError('')
      const created = await createWithdrawal({
        amount: previewData.amount,
        bankName: previewData.bankName,
        accountNumber: previewData.accountNumber,
      })

      setIsModalOpen(false)
      showToast(`Tạo yêu cầu rút tiền #${created.id} thành công!`)

      // Refresh wallet & withdrawals list
      const [walletRes, listRes] = await Promise.all([
        getOrganizerWallet().catch(() => null),
        getWithdrawals(statusFilter || undefined).catch(() => []),
      ])
      if (walletRes) setWallet(walletRes)
      setWithdrawals(listRes)
      setSelectedWithdrawal(created)
    } catch (cause) {
      if (cause instanceof ApiError && cause.data?.message) {
        setModalError(cause.data.message)
      } else {
        setModalError('Có lỗi khi tạo yêu cầu rút tiền. Vui lòng thử lại.')
      }
    } finally {
      setModalLoading(false)
    }
  }

  async function handleCancelWithdrawal(item: WithdrawalRequestItem) {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn hủy yêu cầu rút tiền #${item.id} (${item.formattedAmount})? Số tiền sẽ được hoàn trả lại về số dư khả dụng.`
    )
    if (!confirmed) return

    try {
      setCancelLoading(true)
      const canceled = await cancelWithdrawal(item.id)
      showToast(`Đã hủy yêu cầu rút tiền #${item.id} thành công!`)

      setSelectedWithdrawal(canceled)
      const [walletRes, listRes] = await Promise.all([
        getOrganizerWallet().catch(() => null),
        getWithdrawals(statusFilter || undefined).catch(() => []),
      ])
      if (walletRes) setWallet(walletRes)
      setWithdrawals(listRes)
    } catch (cause) {
      if (cause instanceof ApiError && cause.data?.message) {
        alert(cause.data.message)
      } else {
        alert('Không thể hủy yêu cầu này.')
      }
    } finally {
      setCancelLoading(false)
    }
  }

  const eventList = revenue?.events ?? revenue?.eventRevenues ?? []

  // UC 24 & 26: Export financial statement to CSV using real data
  function handleExportFinancialReport() {
    if (!wallet && eventList.length === 0 && withdrawals.length === 0) {
      showToast('Chưa có dữ liệu tài chính để xuất báo cáo.')
      return
    }

    const lines: string[] = []
    lines.push('BÁO CÁO TÀI CHÍNH & LỊCH SỬ RÚT TIỀN - EVENTHUB')
    lines.push(`Ban tổ chức:,"${(user?.fullName || user?.email || 'Organizer').replace(/"/g, '""')}"`)
    lines.push(`Thời gian xuất báo cáo:,"${new Date().toLocaleString('vi-VN')}"`)
    lines.push('')
    lines.push('TỔNG QUAN VÍ DOANH NGHIỆP')
    lines.push(`Số dư khả dụng:,"${wallet?.formattedAvailableBalance || '0 đ'}"`)
    lines.push(`Số dư chờ xác nhận:,"${wallet?.formattedPendingBalance || '0 đ'}"`)
    lines.push(`Số dư đang chờ rút:,"${wallet?.formattedWithdrawalPendingBalance || '0 đ'}"`)
    lines.push(`Tổng tiền đã rút:,"${wallet?.formattedTotalWithdrawn || '0 đ'}"`)
    lines.push('')

    lines.push('CHI TIẾT DOANH THU THEO TỪNG SỰ KIỆN')
    lines.push('Mã sự kiện,Tên sự kiện,Số vé đã bán,Tổng doanh thu (VNĐ),Phí sàn 5% (VNĐ),Thực nhận 95% (VNĐ)')
    if (eventList.length === 0) {
      lines.push('Chưa có sự kiện nào phát sinh doanh thu,,,,,,')
    } else {
      eventList.forEach((evt) => {
        const gross = Number(evt.revenue ?? evt.totalRevenue ?? 0)
        const sold = Number(evt.soldTickets ?? evt.totalTicketsSold ?? 0)
        const fee = Math.round(gross * 0.05)
        const net = gross - fee
        lines.push(
          `"#EVT-${evt.eventId}","${(evt.eventName || '').replace(/"/g, '""')}",${sold},${gross},${fee},${net}`
        )
      })
    }
    lines.push('')

    lines.push('CHI TIẾT LỊCH SỬ YÊU CẦU RÚT TIỀN')
    lines.push('Mã yêu cầu,Thời gian tạo,Số tiền (VNĐ),Ngân hàng,Số tài khoản,Trạng thái,Mã giao dịch đối soát,Lý do từ chối,Thời gian xử lý')
    const withdrawList = allWithdrawals.length > 0 ? allWithdrawals : withdrawals
    if (withdrawList.length === 0) {
      lines.push('Chưa có yêu cầu rút tiền nào,,,,,,,,')
    } else {
      withdrawList.forEach((w) => {
        const statusMap: Record<string, string> = {
          PENDING: 'Chờ duyệt',
          APPROVED: 'Đã duyệt & Chi',
          REJECTED: 'Bị từ chối',
          CANCELLED: 'Đã hủy',
          CANCELED: 'Đã hủy',
        }
        const st = statusMap[w.status?.toUpperCase()] || w.status || 'Chờ duyệt'
        lines.push(
          `"#WTH-${w.id}","${w.requestedAt || '—'}",${w.amount},"${(w.bankName || '').replace(/"/g, '""')}","\t${w.accountNumber || ''}","${st}","${w.transactionCode || '—'}","${(w.rejectReason || '').replace(/"/g, '""')}","${w.processedAt || '—'}"`
        )
      })
    }

    const csvContent = '\uFEFF' + lines.join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Bao_cao_tai_chinh_EventHub_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('Xuất báo cáo tài chính thành công!')
  }

  // Filter withdrawals by search query
  const filteredWithdrawals = withdrawals.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.trim().toLowerCase()
    const idStr = String(item.id).toLowerCase()
    const codeStr = `#wth-${idStr}`
    const bankStr = (item.bankName || '').toLowerCase()
    const accStr = (item.accountNumber || '').toLowerCase()
    return (
      idStr.includes(q) ||
      codeStr.includes(q) ||
      bankStr.includes(q) ||
      accStr.includes(q)
    )
  })

  // Calculate tab count badges
  const sourceForCounts = allWithdrawals.length > 0 ? allWithdrawals : withdrawals
  const countAll = sourceForCounts.length
  const countPending = sourceForCounts.filter((w) => w.status === 'PENDING').length
  const countApproved = sourceForCounts.filter((w) => w.status === 'APPROVED').length
  const countRejected = sourceForCounts.filter((w) => w.status === 'REJECTED').length
  const countCancelled = sourceForCounts.filter((w) => w.status === 'CANCELLED' || w.status === 'CANCELED').length

  return (
    <div className={styles.page}>
      {toastMessage && (
        <div className={styles.toastSuccess}>
          <CheckCircle2 size={20} color="#2dc275" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className={styles.topSection}>
        <div>
          <div className={styles.eyebrow}>
            <Wallet size={16} />
            <span>TÀI CHÍNH &amp; THANH TOÁN BAN TỔ CHỨC</span>
          </div>
          <h1 className={styles.title}>Doanh thu &amp; Quản lý số dư</h1>
          <p className={styles.subtitle}>
            Theo dõi dòng tiền bán vé, hạn mức khả dụng và quản lý các yêu cầu rút tiền về tài khoản ngân hàng liên kết.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={styles.btnExportExcel}
            onClick={handleExportFinancialReport}
          >
            <Download size={18} />
            <span>Xuất báo cáo tài chính</span>
          </button>
          <button
            type="button"
            className={styles.btnCreateWithdrawal}
            onClick={handleOpenCreateModal}
          >
            <PlusCircle size={18} />
            <span>+ Tạo yêu cầu rút tiền</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Financial Metric Cards (UC 24) */}
      <div className={styles.metricGrid}>
        {/* Card 1: Số dư chờ xác nhận */}
        <div className={styles.metricCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Số dư chờ xác nhận</span>
            <div className={`${styles.iconBox} ${styles.iconBlue}`}>
              <Hourglass size={20} />
            </div>
          </div>
          <div className={styles.cardAmount}>
            {wallet?.formattedPendingBalance || '0 đ'}
          </div>
          <div className={styles.cardFooter}>
            <span>Chờ sự kiện hoàn thành đối soát</span>
          </div>
        </div>

        {/* Card 2: Số dư khả dụng (Hero Card) */}
        <div className={`${styles.metricCard} ${styles.heroMetricCard}`}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardLabel} ${styles.heroLabel}`}>
              <span>Số dư khả dụng</span>
              <span className={styles.pulse} />
            </div>
            <div className={`${styles.iconBox} ${styles.iconGreen}`}>
              <Wallet size={20} />
            </div>
          </div>
          <div className={`${styles.cardAmount} ${styles.heroAmount}`}>
            {wallet?.formattedAvailableBalance || '0 đ'}
          </div>
          <div className={styles.cardFooter}>
            <span>Sẵn sàng rút về tài khoản</span>
            <button
              type="button"
              className={styles.btnQuickWithdraw}
              onClick={handleOpenCreateModal}
            >
              Rút ngay <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Card 3: Số dư đang chờ rút */}
        <div className={styles.metricCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Số dư đang chờ rút</span>
            <div className={`${styles.iconBox} ${styles.iconGray}`}>
              <Clock size={20} />
            </div>
          </div>
          <div className={styles.cardAmount}>
            {wallet?.formattedWithdrawalPendingBalance || '0 đ'}
          </div>
          <div className={styles.cardFooter}>
            <span>Đang trong lệnh chờ duyệt</span>
          </div>
        </div>

        {/* Card 4: Tổng tiền đã rút */}
        <div className={styles.metricCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Tổng tiền đã rút</span>
            <div className={`${styles.iconBox} ${styles.iconTeal}`}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className={styles.cardAmount}>
            {wallet?.formattedTotalWithdrawn || '0 đ'}
          </div>
          <div className={styles.cardFooter}>
            <span>Đã quyết toán thành công</span>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Left (Tables) + Right (Drawer UC 27) */}
      <div className={styles.mainLayout}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Revenue By Event Section (UC 24) */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Phân tích doanh thu theo sự kiện</h3>
                <p className={styles.sectionSubtitle}>
                  Tổng hợp vé bán và khấu trừ phí sàn 5% theo từng sự kiện
                </p>
              </div>
              <span style={{ fontSize: '12px', color: '#556257', fontWeight: 600 }}>
                {eventList.length} sự kiện
              </span>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Sự kiện</th>
                    <th style={{ textAlign: 'right' }}>Vé đã bán</th>
                    <th style={{ textAlign: 'right' }}>Tổng doanh thu</th>
                    <th style={{ textAlign: 'right' }}>Phí sàn (5%)</th>
                    <th style={{ textAlign: 'right' }}>Thực nhận (95%)</th>
                  </tr>
                </thead>
                <tbody>
                  {eventList.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                        Chưa có sự kiện nào phát sinh doanh thu.
                      </td>
                    </tr>
                  ) : (
                    eventList.map((evt) => {
                      const gross = Number(evt.revenue ?? evt.totalRevenue ?? 0)
                      const sold = Number(evt.soldTickets ?? evt.totalTicketsSold ?? 0)
                      const net = gross * 0.95
                      const fee = gross * 0.05
                      return (
                        <tr key={evt.eventId}>
                          <td>
                            <strong>{evt.eventName}</strong>
                            <div style={{ fontSize: '11px', color: '#718079' }}>
                              #EVT-{evt.eventId}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {sold.toLocaleString('vi-VN')} vé
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {evt.formattedRevenue || `${gross.toLocaleString('vi-VN')} đ`}
                          </td>
                          <td style={{ textAlign: 'right', color: '#ba1a1a', fontSize: '12px' }}>
                            -{fee.toLocaleString('vi-VN')} đ
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#006d3d' }}>
                            {net.toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Withdrawal History Section (UC 26) */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Lịch sử yêu cầu rút tiền</h3>
                <p className={styles.sectionSubtitle}>
                  Chi tiết danh sách các giao dịch giải ngân về tài khoản doanh nghiệp (UC 26)
                </p>
              </div>

              {/* Search Box */}
              <div className={styles.tableSearchBox}>
                <Search size={16} className={styles.tableSearchIcon} />
                <input
                  type="text"
                  className={styles.tableSearchInput}
                  placeholder="Tìm theo mã #WTH..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className={styles.tabsFilter}>
              {[
                { label: 'Tất cả', value: '', count: countAll },
                { label: 'Chờ duyệt', value: 'PENDING', count: countPending },
                { label: 'Đã duyệt', value: 'APPROVED', count: countApproved },
                { label: 'Bị từ chối', value: 'REJECTED', count: countRejected },
                { label: 'Đã hủy', value: 'CANCELLED', count: countCancelled },
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.value}
                  className={`${styles.tabItem} ${
                    statusFilter === tab.value ? styles.tabItemActive : ''
                  }`}
                  onClick={() => setStatusFilter(tab.value)}
                >
                  <span>{tab.label}</span>
                  <span className={styles.tabCountBadge}>{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Table */}
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã yêu cầu</th>
                    <th>Thời gian tạo</th>
                    <th style={{ textAlign: 'right' }}>Số tiền rút</th>
                    <th>Tài khoản thụ hưởng</th>
                    <th style={{ textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                        Đang tải lịch sử rút tiền...
                      </td>
                    </tr>
                  ) : filteredWithdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
                        {searchQuery ? 'Không tìm thấy yêu cầu nào khớp với từ khóa.' : 'Chưa có yêu cầu rút tiền nào trong mục này.'}
                      </td>
                    </tr>
                  ) : (
                    filteredWithdrawals.map((item) => (
                      <tr
                        key={item.id}
                        className={`${styles.tableRowClickable} ${
                          selectedWithdrawal?.id === item.id ? styles.tableRowSelected : ''
                        }`}
                        onClick={() => void handleSelectWithdrawal(item.id, false)}
                      >
                        <td>
                          <strong>#WTH-{item.id}</strong>
                        </td>
                        <td>
                          <div>{formatDate(item.requestedAt)}</div>
                          <div style={{ fontSize: '11px', color: '#718079' }}>
                            {item.requestedAt ? item.requestedAt.slice(11, 16) : ''}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#191c1e' }}>
                          {item.formattedAmount}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.bankName}</div>
                          <div style={{ fontSize: '11px', color: '#718079' }}>
                            {item.accountNumber}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {renderStatusBadge(item.status)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className={styles.btnViewDetail}
                            onClick={(e) => {
                              e.stopPropagation()
                              void handleSelectWithdrawal(item.id, true)
                            }}
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: UC 27 Drawer Panel (Sticky) */}
        <div>
          {selectedWithdrawal ? (
            <div className={styles.drawerPanel}>
              <div className={styles.drawerHeader}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                      Yêu cầu #WTH-{selectedWithdrawal.id}
                    </h3>
                    {renderStatusBadge(selectedWithdrawal.status)}
                  </div>
                  <p style={{ fontSize: '11px', color: '#718079', margin: '4px 0 0 0' }}>
                    {selectedWithdrawal.status === 'PENDING'
                      ? 'SLA giải ngân dự kiến: trong vòng 4-24 giờ làm việc'
                      : selectedWithdrawal.status === 'APPROVED'
                      ? 'Đã duyệt chi & đối soát thành công'
                      : selectedWithdrawal.status === 'REJECTED'
                      ? 'Yêu cầu bị từ chối xét duyệt'
                      : 'Đã hủy theo yêu cầu của Nhà tổ chức'}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.drawerCloseBtn}
                  title="Đóng panel chi tiết"
                  onClick={() => setSelectedWithdrawal(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.drawerBody}>
                {detailLoading && (
                  <div style={{ fontSize: '12px', color: '#006d3d', textAlign: 'center', fontWeight: 600 }}>
                    Đang đồng bộ chi tiết mới nhất từ hệ thống...
                  </div>
                )}

                {/* Highlight Amount */}
                <div className={styles.amountBox}>
                  <div className={styles.amountBoxLabel}>Số tiền yêu cầu rút</div>
                  <div className={styles.amountBoxVal}>
                    {selectedWithdrawal.formattedAmount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#718079', marginTop: '4px' }}>
                    Phí rút tiền: 0 đ (Miễn phí qua hệ thống liên ngân hàng Napas 24/7)
                  </div>
                </div>

                {/* Stepper UC 27 */}
                <div className={styles.stepper}>
                  <div className={styles.stepperLine} />

                  {/* Step 1: Requested */}
                  <div className={styles.stepItem}>
                    <div className={`${styles.stepDot} ${styles.stepDotActive}`}>
                      <CheckCircle2 size={12} />
                    </div>
                    <div>
                      <div className={styles.stepTextTitle}>Gửi yêu cầu rút tiền thành công</div>
                      <div className={styles.stepTextDesc}>
                        {formatDateTime(selectedWithdrawal.requestedAt)} • Bởi Ban tổ chức
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Processing */}
                  <div className={styles.stepItem}>
                    <div
                      className={`${styles.stepDot} ${
                        selectedWithdrawal.status === 'PENDING'
                          ? styles.stepDotCurrent
                          : selectedWithdrawal.status === 'REJECTED'
                          ? styles.stepDotError
                          : styles.stepDotActive
                      }`}
                    >
                      {selectedWithdrawal.status === 'REJECTED' ? (
                        <Ban size={12} />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                    </div>
                    <div>
                      <div className={styles.stepTextTitle}>
                        {selectedWithdrawal.status === 'REJECTED'
                          ? 'Admin từ chối yêu cầu'
                          : selectedWithdrawal.status === 'CANCELLED' || selectedWithdrawal.status === 'CANCELED'
                          ? 'Đã hủy bởi Ban tổ chức'
                          : selectedWithdrawal.status === 'APPROVED'
                          ? 'Đã hoàn tất kiểm tra & đối soát hợp lệ'
                          : 'Admin đang xét duyệt & đối soát số dư'}
                      </div>
                      <div className={styles.stepTextDesc}>
                        {selectedWithdrawal.rejectReason
                          ? `Lý do: ${selectedWithdrawal.rejectReason}`
                          : selectedWithdrawal.status === 'PENDING'
                          ? 'Đang kiểm tra tính hợp lệ của các booking phát sinh'
                          : selectedWithdrawal.processedAt
                          ? `Hoàn tất lúc: ${formatDateTime(selectedWithdrawal.processedAt)}`
                          : 'Đã hoàn tất đối soát'}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Payout */}
                  <div className={styles.stepItem}>
                    <div
                      className={`${styles.stepDot} ${
                        selectedWithdrawal.status === 'APPROVED'
                          ? styles.stepDotActive
                          : ''
                      }`}
                    >
                      <CreditCard size={12} />
                    </div>
                    <div>
                      <div className={styles.stepTextTitle}>Chuyển khoản liên ngân hàng Napas 24/7</div>
                      <div className={styles.stepTextDesc}>
                        {selectedWithdrawal.status === 'APPROVED'
                          ? selectedWithdrawal.transactionCode
                            ? `Mã giao dịch: ${selectedWithdrawal.transactionCode}`
                            : 'Đã duyệt chi qua Napas 24/7 (Đang cập nhật mã GD)'
                          : 'Thực hiện tự động sau khi được phê duyệt'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Beneficiary Details */}
                <div className={styles.beneficiaryBox}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#556257', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Thông tin thụ hưởng
                  </div>
                  <div className={styles.beneficiaryRow}>
                    <span className={styles.beneficiaryLabel}>Ngân hàng:</span>
                    <span className={styles.beneficiaryVal}>{selectedWithdrawal.bankName}</span>
                  </div>
                  <div className={styles.beneficiaryRow}>
                    <span className={styles.beneficiaryLabel}>Số tài khoản:</span>
                    <span className={styles.beneficiaryVal}>
                      {selectedWithdrawal.accountNumber}
                    </span>
                  </div>
                  <div className={styles.beneficiaryRow}>
                    <span className={styles.beneficiaryLabel}>Chủ tài khoản:</span>
                    <span className={styles.beneficiaryVal}>
                      {user?.fullName || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className={styles.beneficiaryRow}>
                    <span className={styles.beneficiaryLabel}>Mã giao dịch / đối soát:</span>
                    <span
                      className={styles.beneficiaryVal}
                      style={{ fontFamily: 'monospace', color: '#006d3d' }}
                    >
                      {selectedWithdrawal.transactionCode || 'Chưa phát sinh'}
                    </span>
                  </div>
                  {selectedWithdrawal.rejectReason && (
                    <div className={styles.beneficiaryRow} style={{ color: '#ba1a1a' }}>
                      <span className={styles.beneficiaryLabel} style={{ color: '#ba1a1a' }}>
                        Lý do từ chối:
                      </span>
                      <span className={styles.beneficiaryVal} style={{ color: '#ba1a1a' }}>
                        {selectedWithdrawal.rejectReason}
                      </span>
                    </div>
                  )}
                </div>

                {/* Caution Note */}
                <div className={styles.cautionBox}>
                  <Info size={16} color="#006591" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    Lệnh rút tiền chỉ có thể huỷ bỏ trong giai đoạn &ldquo;Chờ duyệt&rdquo;. Sau khi Admin duyệt chi, giao dịch sẽ lập tức đẩy sang cổng thanh toán liên ngân hàng 24/7.
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedWithdrawal.canCancel || selectedWithdrawal.status === 'PENDING') && (
                    <button
                      type="button"
                      className={styles.btnCancelWithdrawal}
                      disabled={cancelLoading}
                      onClick={() => handleCancelWithdrawal(selectedWithdrawal)}
                    >
                      <Ban size={16} />
                      <span>{cancelLoading ? 'Đang hủy...' : 'Hủy yêu cầu rút tiền này'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.btnPrintReceipt}
                    onClick={() => window.print()}
                  >
                    <Printer size={16} />
                    <span>In chứng từ đối soát tạm tính</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.drawerPanel}>
              <div style={{ padding: '40px 24px', textAlign: 'center', color: '#718079' }}>
                <Wallet size={36} color="#bccabc" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ fontSize: '15px', color: '#191c1e', margin: '0 0 6px 0', fontWeight: 700 }}>
                  Chưa chọn yêu cầu rút tiền
                </h4>
                <p style={{ fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                  Nhấn vào bất kỳ hàng nào hoặc nút <strong>&ldquo;Xem chi tiết&rdquo;</strong> ở bảng bên trái để xem tiến trình xét duyệt và thông tin thụ hưởng.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UC 27 Modal: Chi tiết yêu cầu rút tiền (Khi bấm 'Xem chi tiết') */}
      {isDetailModalOpen && selectedWithdrawal && (
        <div className={styles.modalBackdrop} onClick={() => setIsDetailModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 className={styles.modalTitle}>
                  Chi tiết yêu cầu #WTH-{selectedWithdrawal.id}
                </h3>
                {renderStatusBadge(selectedWithdrawal.status)}
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setIsDetailModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.drawerBody} style={{ padding: 0 }}>
              {/* Highlight Amount */}
              <div className={styles.amountBox}>
                <div className={styles.amountBoxLabel}>Số tiền yêu cầu rút</div>
                <div className={styles.amountBoxVal}>
                  {selectedWithdrawal.formattedAmount}
                </div>
                <div style={{ fontSize: '11px', color: '#718079', marginTop: '4px' }}>
                  Phí rút tiền: 0 đ (Miễn phí qua hệ thống liên ngân hàng Napas 24/7)
                </div>
              </div>

              {/* Stepper UC 27 */}
              <div className={styles.stepper}>
                <div className={styles.stepperLine} />

                {/* Step 1: Requested */}
                <div className={styles.stepItem}>
                  <div className={`${styles.stepDot} ${styles.stepDotActive}`}>
                    <CheckCircle2 size={12} />
                  </div>
                  <div>
                    <div className={styles.stepTextTitle}>Gửi yêu cầu rút tiền thành công</div>
                    <div className={styles.stepTextDesc}>
                      {formatDateTime(selectedWithdrawal.requestedAt)} • Bởi Ban tổ chức
                    </div>
                  </div>
                </div>

                {/* Step 2: Processing */}
                <div className={styles.stepItem}>
                  <div
                    className={`${styles.stepDot} ${
                      selectedWithdrawal.status === 'PENDING'
                        ? styles.stepDotCurrent
                        : selectedWithdrawal.status === 'REJECTED'
                        ? styles.stepDotError
                        : styles.stepDotActive
                    }`}
                  >
                    {selectedWithdrawal.status === 'REJECTED' ? (
                      <Ban size={12} />
                    ) : (
                      <CheckCircle2 size={12} />
                    )}
                  </div>
                  <div>
                    <div className={styles.stepTextTitle}>
                      {selectedWithdrawal.status === 'REJECTED'
                        ? 'Admin từ chối yêu cầu'
                        : selectedWithdrawal.status === 'CANCELLED' || selectedWithdrawal.status === 'CANCELED'
                        ? 'Đã hủy bởi Ban tổ chức'
                        : selectedWithdrawal.status === 'APPROVED'
                        ? 'Đã hoàn tất kiểm tra & đối soát hợp lệ'
                        : 'Admin đang xét duyệt & đối soát số dư'}
                    </div>
                    <div className={styles.stepTextDesc}>
                      {selectedWithdrawal.rejectReason
                        ? `Lý do: ${selectedWithdrawal.rejectReason}`
                        : selectedWithdrawal.status === 'PENDING'
                        ? 'Đang kiểm tra tính hợp lệ của các booking phát sinh'
                        : selectedWithdrawal.processedAt
                        ? `Hoàn tất lúc: ${formatDateTime(selectedWithdrawal.processedAt)}`
                        : 'Đã hoàn tất đối soát'}
                    </div>
                  </div>
                </div>

                {/* Step 3: Payout */}
                <div className={styles.stepItem}>
                  <div
                    className={`${styles.stepDot} ${
                      selectedWithdrawal.status === 'APPROVED'
                        ? styles.stepDotActive
                        : ''
                    }`}
                  >
                    <CreditCard size={12} />
                  </div>
                  <div>
                    <div className={styles.stepTextTitle}>Chuyển khoản liên ngân hàng Napas 24/7</div>
                    <div className={styles.stepTextDesc}>
                      {selectedWithdrawal.status === 'APPROVED'
                        ? selectedWithdrawal.transactionCode
                          ? `Mã giao dịch: ${selectedWithdrawal.transactionCode}`
                          : 'Đã duyệt chi qua Napas 24/7 (Đang cập nhật mã GD)'
                        : 'Thực hiện tự động sau khi được phê duyệt'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Beneficiary Details */}
              <div className={styles.beneficiaryBox}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#556257', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Thông tin thụ hưởng
                </div>
                <div className={styles.beneficiaryRow}>
                  <span className={styles.beneficiaryLabel}>Ngân hàng:</span>
                  <span className={styles.beneficiaryVal}>{selectedWithdrawal.bankName}</span>
                </div>
                <div className={styles.beneficiaryRow}>
                  <span className={styles.beneficiaryLabel}>Số tài khoản:</span>
                  <span className={styles.beneficiaryVal}>
                    {selectedWithdrawal.accountNumber}
                  </span>
                </div>
                <div className={styles.beneficiaryRow}>
                  <span className={styles.beneficiaryLabel}>Chủ tài khoản:</span>
                  <span className={styles.beneficiaryVal}>
                    {user?.fullName || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className={styles.beneficiaryRow}>
                  <span className={styles.beneficiaryLabel}>Mã giao dịch / đối soát:</span>
                  <span
                    className={styles.beneficiaryVal}
                    style={{ fontFamily: 'monospace', color: '#006d3d' }}
                  >
                    {selectedWithdrawal.transactionCode || 'Chưa phát sinh'}
                  </span>
                </div>
                {selectedWithdrawal.rejectReason && (
                  <div className={styles.beneficiaryRow} style={{ color: '#ba1a1a' }}>
                    <span className={styles.beneficiaryLabel} style={{ color: '#ba1a1a' }}>
                      Lý do từ chối:
                    </span>
                    <span className={styles.beneficiaryVal} style={{ color: '#ba1a1a' }}>
                      {selectedWithdrawal.rejectReason}
                    </span>
                  </div>
                )}
              </div>

              {/* Caution Note */}
              <div className={styles.cautionBox}>
                <Info size={16} color="#006591" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  Lệnh rút tiền chỉ có thể huỷ bỏ trong giai đoạn &ldquo;Chờ duyệt&rdquo;. Sau khi Admin duyệt chi, giao dịch sẽ lập tức đẩy sang cổng thanh toán liên ngân hàng 24/7.
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
                {(selectedWithdrawal.canCancel || selectedWithdrawal.status === 'PENDING') && (
                  <button
                    type="button"
                    className={styles.btnCancelWithdrawal}
                    disabled={cancelLoading}
                    onClick={() => {
                      void handleCancelWithdrawal(selectedWithdrawal)
                      setIsDetailModalOpen(false)
                    }}
                  >
                    <Ban size={16} />
                    <span>{cancelLoading ? 'Đang hủy...' : 'Hủy yêu cầu rút tiền này'}</span>
                  </button>
                )}

                <button
                  type="button"
                  className={styles.btnPrintReceipt}
                  onClick={() => window.print()}
                >
                  <Printer size={16} />
                  <span>In chứng từ đối soát tạm tính</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UC 25 Modal: Tạo yêu cầu rút tiền */}
      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalStep === 'INPUT' ? 'Tạo yêu cầu rút tiền' : 'Xác nhận thông tin rút tiền'}
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setIsModalOpen(false)}
                disabled={modalLoading}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && <div className={styles.errorBox}>{modalError}</div>}

            {modalStep === 'INPUT' ? (
              <form onSubmit={handleProceedToConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(45, 194, 117, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: '#556257', textTransform: 'uppercase', fontWeight: 700 }}>
                      Số dư khả dụng hiện tại
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#006d3d' }}>
                      {wallet?.formattedAvailableBalance || '0 đ'}
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#2dc275',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      if (wallet?.availableBalance) {
                        setWithdrawAmount(String(wallet.availableBalance))
                      }
                    }}
                  >
                    Rút tối đa
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>
                    Số tiền muốn rút (VNĐ) <span style={{ color: '#ba1a1a' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="100000"
                    step="10000"
                    required
                    className={styles.inputField}
                    placeholder="ví dụ: 10000000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                  <small style={{ fontSize: '11px', color: '#718079' }}>
                    Số tiền rút phải lớn hơn 0 đ và không vượt quá số dư khả dụng thực tế.
                  </small>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>
                    Tên ngân hàng <span style={{ color: '#ba1a1a' }}>*</span>
                  </label>
                  <select
                    className={styles.inputField}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  >
                    <option value="Vietcombank">Vietcombank (VCB)</option>
                    <option value="Techcombank">Techcombank (TCB)</option>
                    <option value="MB Bank">MB Bank (Ngân hàng Quân Đội)</option>
                    <option value="ACB">ACB (Ngân hàng Á Châu)</option>
                    <option value="VietinBank">VietinBank</option>
                    <option value="BIDV">BIDV</option>
                    <option value="VPBank">VPBank</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>
                    Số tài khoản ngân hàng <span style={{ color: '#ba1a1a' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className={styles.inputField}
                    placeholder="ví dụ: 0071001234567"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.btnModalCancel}
                    onClick={() => setIsModalOpen(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className={styles.btnModalSubmit}
                    disabled={modalLoading}
                  >
                    {modalLoading ? 'Đang kiểm tra...' : 'Tiếp tục kiểm tra'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '13px', color: '#556257', margin: 0 }}>
                  Vui lòng kiểm tra lại thông tin trước khi xác nhận gửi yêu cầu tới Admin:
                </p>

                <div className={styles.beneficiaryBox}>
                  <div className={styles.beneficiaryRow}>
                    <span className={styles.beneficiaryLabel}>Số tiền rút:</span>
                    <strong style={{ color: '#006d3d', fontSize: '15px' }}>
                      {previewData?.formattedAmount}
                    </strong>
                  </div>
                  <div className={styles.beneficiaryRow}>
                    <span className={styles.beneficiaryLabel}>Ngân hàng:</span>
                    <span className={styles.beneficiaryVal}>{previewData?.bankName}</span>
                  </div>
                  <div className={styles.beneficiaryRow}>
                    <span className={styles.beneficiaryLabel}>Số tài khoản:</span>
                    <span className={styles.beneficiaryVal}>{previewData?.accountNumber}</span>
                  </div>
                  <div
                    className={styles.beneficiaryRow}
                    style={{ borderTop: '1px solid #d8dadd', paddingTop: '8px', marginTop: '4px' }}
                  >
                    <span className={styles.beneficiaryLabel}>Số dư khả dụng hiện tại:</span>
                    <span className={styles.beneficiaryVal}>
                      {previewData?.formattedCurrentAvailableBalance || previewData?.formattedAvailableBalanceBefore || wallet?.formattedAvailableBalance || '0 đ'}
                    </span>
                  </div>
                  <div className={styles.beneficiaryRow}>
                    <span className={styles.beneficiaryLabel}>Số dư khả dụng còn lại sau khi rút:</span>
                    <strong style={{ color: '#ba1a1a' }}>
                      {previewData?.formattedAvailableBalanceAfter}
                    </strong>
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.btnModalCancel}
                    onClick={() => setModalStep('INPUT')}
                    disabled={modalLoading}
                  >
                    Quay lại sửa
                  </button>
                  <button
                    type="button"
                    className={styles.btnModalSubmit}
                    onClick={handleConfirmSubmit}
                    disabled={modalLoading}
                  >
                    {modalLoading ? 'Đang gửi...' : 'Xác nhận gửi yêu cầu'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
