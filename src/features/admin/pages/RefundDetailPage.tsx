import { useCallback } from 'react'
import { Link, useParams } from 'react-router'
import { financeApi } from '../api/admin-finance-api'
import { useAdminData } from '../hooks/use-admin-data'
import { LoadState } from '../components/AdminComponents'
import { RefundManagement } from '../components/RefundManagement'
import styles from './Admin.module.css'

export function RefundDetailPage() {
  const { eventId } = useParams()
  const id = Number(eventId)
  const load = useCallback((signal: AbortSignal) => financeApi.refundDetail(id, 0, signal), [id])
  const { data, loading, error, reload } = useAdminData(load)
  return <>
    <div className={styles.heading}><div>
      <Link to="/admin/refunds">← Sự kiện đã hủy</Link>
      <h1 style={{ marginTop: 12 }}>{data?.eventName ?? `Sự kiện #${eventId}`}</h1>
      {data && <p>Lý do hủy: {data.cancelReason || 'Chưa có lý do'}</p>}
    </div></div>
    <LoadState loading={loading} error={error} retry={reload} />
    {data && <RefundManagement key={id} eventId={id} canRefund={data.canRefund} unavailableReason={data.unavailableReason} />}
  </>
}
