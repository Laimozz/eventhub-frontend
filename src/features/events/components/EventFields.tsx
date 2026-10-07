import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ImagePlus, Trash2, Upload, X } from 'lucide-react'
import styles from '../pages/CreateEventPage.module.css'

export function Field({ id, label, required, error, hint, children }: { id: string; label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return <div className={styles.field}><label htmlFor={id}>{label}{required && <span className={styles.required}> *</span>}</label>{children}{error ? <p className={styles.fieldError} id={`${id}-error`} role="alert">{error}</p> : hint && <small className={styles.hint}>{hint}</small>}</div>
}

export function ImagePreview({ file, url, alt, className }: { file: File | null; url?: string | null; alt: string; className?: string }) {
  const image = useRef<HTMLImageElement>(null)
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    if (image.current) image.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])
  return file || url ? <img ref={image} src={file ? undefined : url ?? undefined} alt={alt} className={className} /> : <span className={className}><ImagePlus size={22} /></span>
}

export function ImageField({ id, label, value, existingUrl, onChange, required, error, compact }: {
  id: string; label: string; value: File | null; existingUrl?: string | null; onChange: (file: File | null) => void; required?: boolean; error?: string; compact?: boolean
}) {
  const [fileError, setFileError] = useState('')
  function choose(file?: File) {
    if (!file) return
    if (!['image/jpeg', 'image/png'].includes(file.type)) { setFileError('Vui lòng chọn ảnh JPG hoặc PNG.'); return }
    if (file.size > 5 * 1024 * 1024) { setFileError('Ảnh không được vượt quá 5 MB.'); return }
    setFileError(''); onChange(file)
  }
  return <div className={`${styles.imageField} ${compact ? styles.compactImage : ''}`}>
    <span className={styles.imageLabel}>{label}{required && <span className={styles.required}> *</span>}</span>
    <div className={styles.dropzone} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); choose(event.dataTransfer.files[0]) }}>
      {(value || existingUrl) && <div className={styles.imagePreview}><ImagePreview file={value} url={existingUrl} alt={`Xem trước ${label.toLowerCase()}`} /><button type="button" aria-label={`Xóa ${label.toLowerCase()}`} onClick={() => { onChange(null); setFileError('') }}><Trash2 size={15} /></button></div>}
      <label className={styles.uploadLabel} htmlFor={`${id}-file`}>{value || existingUrl ? <Upload size={21} /> : <ImagePlus size={29} />}<strong>{value || existingUrl ? 'Thay ảnh' : 'Chọn ảnh hoặc kéo thả vào đây'}</strong><span>JPG, PNG · Tối đa 5 MB</span></label>
      <input type="file" id={`${id}-file`} accept="image/jpeg,image/png" className={styles.fileInput} onChange={event => { choose(event.currentTarget.files?.[0]); event.currentTarget.value = '' }} />
    </div>
    {(error || fileError) && <p className={styles.fieldError} role="alert">{fileError || error}</p>}
  </div>
}

export function EditorDialog({ title, subtitle, onClose, children, busy }: { title: string; subtitle: string; onClose: () => void; children: ReactNode; busy: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close() }, [])
  return <dialog ref={dialog} className={styles.dialog} aria-label={title} onCancel={event => { event.preventDefault(); if (!busy) onClose() }} onClick={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <div className={styles.dialogHeader}><div><h2>{title}</h2><p>{subtitle}</p></div><button type="button" className={styles.iconButton} aria-label="Đóng" disabled={busy} onClick={onClose}><X size={20} /></button></div>{children}
  </dialog>
}
