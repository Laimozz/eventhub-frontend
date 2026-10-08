import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import styles from '../pages/Admin.module.css'

export function Dialog({ title, busy, close, children }: { title: string; busy: boolean; close: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal() }, [])
  return <dialog ref={ref} className={styles.dialog} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) close() }}>
    <header><h2>{title}</h2><button type="button" disabled={busy} onClick={close} aria-label="Đóng hộp thoại">×</button></header>{children}
  </dialog>
}
export function Pagination({ page, totalPages, totalElements, change }: { page: number; totalPages: number; totalElements: number; change: (page: number) => void }) {
  return <div className={styles.pagination}><span>{totalElements.toLocaleString('vi-VN')} kết quả • Trang {page + 1}/{Math.max(1, totalPages)}</span>
    <div><button disabled={page === 0} onClick={() => change(page - 1)}>Trước</button><button disabled={page + 1 >= totalPages} onClick={() => change(page + 1)}>Sau</button></div></div>
}
export function LoadState({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (loading) return <p role="status" className={styles.empty}>Đang tải dữ liệu…</p>
  return error ? <div className={styles.empty}><p role="alert">{error}</p><button onClick={retry}>Thử lại</button></div> : null
}
