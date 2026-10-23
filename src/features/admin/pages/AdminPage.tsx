import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { financeApi, money } from '../api/admin-finance-api'
import type { AdminMonthlyTrend, AdminStatusBreakdown, AdminCategoryRevenue } from '../types/finance'
import { useAdminData } from '../hooks/use-admin-data'
import { LoadState } from '../components/AdminComponents'
import styles from './Admin.module.css'
import finance from './Finance.module.css'
import { RefundManagement } from '../components/RefundManagement'

export function AdminPage() {
  const { data, loading, error, reload } = useAdminData(financeApi.overview)
  const [monthlyTrends, setMonthlyTrends] = useState<AdminMonthlyTrend[]>([])
  const [statusBreakdown, setStatusBreakdown] = useState<AdminStatusBreakdown[]>([])
  const [categoryRevenues, setCategoryRevenues] = useState<AdminCategoryRevenue[]>([])

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      financeApi.monthlyStats(6, controller.signal).catch(() => []),
      financeApi.statusBreakdown(controller.signal).catch(() => []),
      financeApi.categoryBreakdown(controller.signal).catch(() => []),
    ]).then(([m, s, c]) => {
      setMonthlyTrends(m)
      setStatusBreakdown(s)
      setCategoryRevenues(c)
    })
    return () => controller.abort()
  }, [])

  const handleFullReload = () => {
    reload()
    financeApi.monthlyStats(6).then(setMonthlyTrends).catch(() => {})
    financeApi.statusBreakdown().then(setStatusBreakdown).catch(() => {})
    financeApi.categoryBreakdown().then(setCategoryRevenues).catch(() => {})
  }

  const maxMonthlyRev = Math.max(...monthlyTrends.map((m) => m.grossRevenue), 1)

  return (
    <>
      <div className={styles.heading}>
        <div>
          <h1>Thống kê tổng quan</h1>
          <p>Báo cáo hoạt động, tăng trưởng doanh thu và số dư toàn hệ thống theo thời gian thực</p>
        </div>
        <button onClick={handleFullReload}>Làm mới</button>
      </div>

      <LoadState loading={loading} error={error} retry={handleFullReload} />

      {data && (
        <>
          {/* 10 Core Metric Cards */}
          <div className={finance.metrics}>
            {[
              ['Tiền vé thanh toán thành công', money(data.grossRevenue)],
              ['Tiền đã hoàn', money(data.totalRefunded)],
              ['Doanh thu nền tảng (5% sau hoàn)', money(data.netRevenue)],
              ['Tổng số sự kiện', data.totalEvents.toLocaleString('vi-VN')],
              ['Tổng số vé đã bán', data.totalTicketsSold.toLocaleString('vi-VN')],
              ['Tổng số người dùng', data.totalUsers.toLocaleString('vi-VN')],
              ['Số dư khả dụng Organizer', money(data.availableBalance)],
              ['Tổng số tiền đã rút', money(data.totalWithdrawn)],
              ['Số dư chờ xác nhận', money(data.pendingBalance)],
              ['Số dư chờ rút', money(data.withdrawalPendingBalance)],
            ].map(([label, value]) => (
              <article key={label} className={styles.panel}>
                <p className={styles.eyebrow}>{label}</p>
                <strong>{value}</strong>
              </article>
            ))}
          </div>

          <p style={{ color: '#65766e', fontSize: '13px', marginTop: '12px', marginBottom: '24px' }}>
            * Số dư là tổng tài sản trên ví của các nhà tổ chức, không phải doanh thu hay tiền thuộc sở hữu của nền tảng.
          </p>

          {data.revenueUnavailableReason && <p className={styles.notice}>{data.revenueUnavailableReason}</p>}

          {/* Biểu đồ biến động doanh thu toàn sàn theo tháng & Phân bổ sự kiện theo trạng thái */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {/* Box 1: Biến động doanh thu 6 tháng */}
            <div className={styles.panel} style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px' }}>Doanh thu toàn hệ thống 6 tháng gần nhất</h2>
                  <small style={{ color: '#65766e' }}>Theo các giao dịch thanh toán thành công qua cổng</small>
                </div>
              </div>

              {monthlyTrends.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px', paddingBottom: '10px', borderBottom: '1px solid #edf0ee' }}>
                    {monthlyTrends.map((item, idx) => {
                      const heightPercent = Math.max(12, Math.round((item.grossRevenue / maxMonthlyRev) * 100))
                      const isLatest = idx === monthlyTrends.length - 1
                      return (
                        <div key={item.monthKey} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: isLatest ? '#087f50' : '#65766e' }}>
                            {item.totalTransactions} đơn
                          </span>
                          <div
                            style={{
                              width: '100%',
                              maxWidth: '42px',
                              height: `${heightPercent}%`,
                              borderRadius: '6px 6px 0 0',
                              backgroundColor: isLatest ? '#20bd79' : '#b2e2cd',
                              transition: 'height 0.3s ease',
                            }}
                            title={`${item.monthLabel}: ${item.formattedGrossRevenue} (${item.totalTransactions} giao dịch)`}
                          />
                          <span style={{ fontSize: '12px', fontWeight: isLatest ? 700 : 500, color: isLatest ? '#087f50' : '#182b25' }}>
                            {item.monthLabel}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '13px', color: '#65766e' }}>
                    <span>Tổng 6 tháng: <strong>{money(monthlyTrends.reduce((s, x) => s + x.grossRevenue, 0))}</strong></span>
                    <span>Hoa hồng sàn (5%): <strong style={{ color: '#087f50' }}>{money(monthlyTrends.reduce((s, x) => s + x.netRevenue, 0))}</strong></span>
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', padding: '30px 0', color: '#65766e' }}>Đang tổng hợp số liệu giao dịch thanh toán...</p>
              )}
            </div>

            {/* Box 2: Phân bổ sự kiện theo trạng thái */}
            <div className={styles.panel} style={{ marginBottom: 0 }}>
              <h2 style={{ margin: 0, fontSize: '18px', marginBottom: '6px' }}>Phân bổ sự kiện theo trạng thái</h2>
              <small style={{ color: '#65766e', display: 'block', marginBottom: '16px' }}>Tỷ lệ % quy mô sự kiện trên sàn</small>

              {statusBreakdown.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {statusBreakdown.map((item) => {
                    const barColor =
                      item.status === 'COMPLETED'
                        ? '#087f50'
                        : item.status === 'APPROVED' || item.status === 'ONGOING'
                        ? '#20bd79'
                        : item.status.includes('PENDING')
                        ? '#e6a100'
                        : '#ba1a1a'

                    return (
                      <div key={item.status}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>{item.statusLabel}</span>
                          <span>
                            <strong>{item.totalEvents}</strong> sự kiện ({item.percentage}%)
                          </span>
                        </div>
                        <div style={{ height: '8px', background: '#edf0ee', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, item.percentage)}%`, height: '100%', backgroundColor: barColor, borderRadius: '4px' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ textAlign: 'center', padding: '30px 0', color: '#65766e' }}>Chưa có sự kiện trong hệ thống.</p>
              )}
            </div>
          </div>

          {/* Bảng phân bổ doanh thu theo danh mục */}
          {categoryRevenues.length > 0 && (
            <div className={styles.panel}>
              <h2 style={{ margin: 0, fontSize: '18px', marginBottom: '6px' }}>Thống kê doanh số theo danh mục sự kiện</h2>
              <small style={{ color: '#65766e', display: 'block', marginBottom: '16px' }}>Xếp hạng ngành hàng đóng góp doanh thu lớn nhất cho EventHub</small>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Danh mục</th>
                      <th>Số sự kiện</th>
                      <th>Lượt đặt vé</th>
                      <th>Tổng doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryRevenues.map((cat) => (
                      <tr key={cat.categoryId}>
                        <td><strong>{cat.categoryName}</strong></td>
                        <td>{cat.totalEvents.toLocaleString('vi-VN')} sự kiện</td>
                        <td>{cat.totalOrders.toLocaleString('vi-VN')} đơn</td>
                        <td style={{ fontWeight: 700, color: '#087f50' }}>{cat.formattedGrossRevenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className={styles.panel}>
            <h2>Xử lý tài chính</h2>
            <div className={styles.actions}>
              <Link to="/admin/withdrawals">Yêu cầu rút tiền</Link>
              <Link to="/admin/refunds">Sự kiện đã hủy</Link>
            </div>
          </div>
        </>
      )}

      <RefundManagement />
    </>
  )
}
