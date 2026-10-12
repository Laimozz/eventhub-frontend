import { Link } from 'react-router'
import { financeApi, money } from '../api/admin-finance-api'
import { useAdminData } from '../hooks/use-admin-data'
import { LoadState } from '../components/AdminComponents'
import styles from './Admin.module.css'
import finance from './Finance.module.css'

export function AdminPage() {
  const { data, loading, error, reload } = useAdminData(financeApi.overview)
  return <>
    <div className={styles.heading}><div><h1>Thống kê tổng quan</h1><p>Hoạt động và số dư toàn hệ thống</p></div><button onClick={reload}>Làm mới</button></div>
    <LoadState loading={loading} error={error} retry={reload} />
    {data && <>
      <div className={finance.metrics}>{[
        ['Tổng doanh thu hệ thống', money(data.grossRevenue)],
        ['Tổng số sự kiện', data.totalEvents.toLocaleString('vi-VN')],
        ['Tổng số vé đã bán', data.totalTicketsSold.toLocaleString('vi-VN')],
        ['Tổng số người dùng', data.totalUsers.toLocaleString('vi-VN')],
        ['Số dư khả dụng Organizer', money(data.availableBalance)],
        ['Tổng số tiền đã rút', money(data.totalWithdrawn)],
        ['Số dư chờ xác nhận', money(data.pendingBalance)],
        ['Số dư chờ rút', money(data.withdrawalPendingBalance)],
      ].map(([label, value]) => <article key={label} className={styles.panel}><p className={styles.eyebrow}>{label}</p><strong>{value}</strong></article>)}</div>
      <p className={styles.notice}>{data.revenueUnavailableReason}</p>
      <div className={styles.panel}><h2>Xử lý tài chính</h2><div className={styles.actions}><Link to="/admin/withdrawals">Yêu cầu rút tiền</Link><Link to="/admin/refunds">Sự kiện đã hủy</Link></div></div>
    </>}
  </>
}
