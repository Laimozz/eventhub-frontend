import { useCallback, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { Plus } from 'lucide-react'
import { adminApi, errorMessage, fieldErrors } from '../api/admin-api'
import { useAdminData } from '../hooks/use-admin-data'
import { Dialog, LoadState, Pagination } from '../components/AdminComponents'
import type { Category } from '../types/admin'
import styles from './Admin.module.css'

export function EventCategoriesPage() {
  const [params, setParams] = useSearchParams()
  const query = params.toString()
  const { data, error, loading, reload } = useAdminData(useCallback((signal: AbortSignal) => adminApi.categories(query, signal), [query]))
  const [mode, setMode] = useState<'create' | 'edit' | 'delete'>()
  const [target, setTarget] = useState<Category>()
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState('')
  function open(value: typeof mode, item?: Category) { setTarget(item); setMode(value); setFormError(''); setErrors({}) }
  function close() { if (!sending.current) setMode(undefined) }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (sending.current) return
    const fields = new FormData(event.currentTarget)
    const name = String(fields.get('name') ?? '').trim()
    const description = String(fields.get('description') ?? '').trim()
    setFormError(''); setErrors({})
    if (mode !== 'delete' && (!name || !description)) { setFormError('Vui lòng nhập tên và mô tả danh mục.'); return }
    sending.current = true; setBusy(true)
    try {
      if (mode === 'delete' && target) await adminApi.deleteCategory(target.id)
      else await adminApi.saveCategory({ name, description }, target?.id)
      setMode(undefined); setNotice('Đã cập nhật danh mục thành công.')
      if (mode === 'delete' && data?.items.length === 1 && data.page > 0) setParams({ page: String(data.page - 1) })
      else reload()
    } catch (cause) { setFormError(errorMessage(cause)); setErrors(fieldErrors(cause)) }
    finally { sending.current = false; setBusy(false) }
  }
  return <>
    <div className={styles.heading}><div><h1>Quản lý danh mục sự kiện</h1><p>Phân loại sự kiện trên EventHub.</p></div><button className={styles.primary} onClick={() => open('create')}><Plus size={18} />Thêm danh mục</button></div>
    <p className={styles.notice}>Danh mục có sự kiện đang sử dụng sẽ không thể xóa.</p>
    {notice && <p role="status">{notice}</p>}
    <section className={styles.panel}><LoadState loading={loading} error={error} retry={reload} />
      {data && <><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Tên danh mục</th><th>Mô tả</th><th>Thao tác</th></tr></thead><tbody>{data.items.map(item => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.description || '—'}</td><td><div className={styles.actions}><button onClick={() => open('edit', item)} aria-label={'Sửa ' + item.name}>Sửa</button><button className={styles.danger} onClick={() => open('delete', item)} aria-label={'Xóa ' + item.name}>Xóa</button></div></td></tr>)}</tbody></table></div>
        {!data.items.length && <p className={styles.empty}>Chưa có danh mục sự kiện.</p>}<Pagination {...data} change={page => setParams({ page: String(page) })} /></>}
    </section>
    {mode && <Dialog title={mode === 'create' ? 'Thêm danh mục' : mode === 'edit' ? 'Sửa danh mục' : 'Xóa danh mục'} busy={busy} close={close}><form onSubmit={save}>
      {mode === 'delete' ? <p>Bạn có chắc muốn xóa danh mục <strong>{target?.name}</strong>?</p> : <>
        <label>Tên danh mục<input name="name" required maxLength={255} defaultValue={target?.name ?? ''} autoFocus />{errors.name && <span className={styles.fieldError}>{errors.name}</span>}</label>
        <label>Mô tả<textarea name="description" required maxLength={255} defaultValue={target?.description ?? ''} />{errors.description && <span className={styles.fieldError}>{errors.description}</span>}</label>
      </>}
      {formError && <p role="alert" className={styles.error}>{formError}</p>}
      <div className={styles.actions}><button type="button" disabled={busy} onClick={close}>Hủy bỏ</button><button className={mode === 'delete' ? styles.danger : styles.primary} disabled={busy}>{busy ? 'Đang lưu…' : mode === 'delete' ? 'Xác nhận xóa' : 'Lưu danh mục'}</button></div>
    </form></Dialog>}
  </>
}
