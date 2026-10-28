import { useEffect, useState } from 'react'
import {
  Lock,
  Mail,
  Search,
  Trash2,
  Unlock,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { ApiError } from '../../../lib/http-client'
import {
  addEventStaff,
  deleteEventStaff,
  getEventStaffs,
  updateStaffStatus,
} from '../api/event-api'
import type { EventStaff } from '../types/event'
import styles from './EventStaffSection.module.css'

interface Props {
  eventId: number
  eventName: string
}

export function EventStaffSection({ eventId, eventName }: Props) {
  const [staffs, setStaffs] = useState<EventStaff[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Add Staff Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  // Action Pending
  const [actionPendingId, setActionPendingId] = useState<number | null>(null)

  useEffect(() => {
    let ignore = false
    async function fetchStaffs() {
      try {
        const data = await getEventStaffs(eventId)
        if (!ignore) {
          setStaffs(data)
          setError('')
        }
      } catch {
        if (!ignore) {
          setError('Không thể tải danh sách nhân viên soát vé.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    void fetchStaffs()
    return () => {
      ignore = true
    }
  }, [eventId])

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault()
    if (!emailInput.trim()) {
      setModalError('Vui lòng nhập email tài khoản của nhân viên.')
      return
    }

    try {
      setModalLoading(true)
      setModalError('')
      const newStaff = await addEventStaff(eventId, emailInput.trim())
      setStaffs((prev) => [newStaff, ...prev])
      setIsModalOpen(false)
      setEmailInput('')
      setNotice(`Đã phân công thành công nhân viên ${newStaff.fullName || newStaff.email}.`)
      setTimeout(() => setNotice(''), 4000)
    } catch (cause) {
      if (cause instanceof ApiError && cause.data?.message) {
        setModalError(cause.data.message)
      } else {
        setModalError('Không thể thêm nhân viên. Vui lòng kiểm tra lại email tài khoản.')
      }
    } finally {
      setModalLoading(false)
    }
  }

  async function handleToggleStatus(staff: EventStaff) {
    const isCurrentlyActive = staff.status === 'ACTIVE'
    const nextStatus = isCurrentlyActive ? 'LOCKED' : 'ACTIVE'
    const actionName = nextStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'

    try {
      setActionPendingId(staff.staffId)
      const targetId = staff.staffId || staff.id!
      const updated = await updateStaffStatus(eventId, targetId, nextStatus)
      setStaffs((prev) =>
        prev.map((s) =>
          s.staffId === staff.staffId || (s.id && s.id === staff.id)
            ? { ...s, ...updated, status: updated.status || nextStatus }
            : s
        )
      )
      setNotice(`Đã ${actionName} thành công tài khoản của nhân viên ${staff.fullName || staff.email}.`)
      setTimeout(() => setNotice(''), 3000)
    } catch (cause) {
      if (cause instanceof ApiError && cause.data?.message) {
        alert(cause.data.message)
      } else {
        alert(`Không thể ${actionName} nhân viên này.`)
      }
    } finally {
      setActionPendingId(null)
    }
  }

  async function handleDeleteStaff(staff: EventStaff) {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa nhân viên "${staff.fullName || staff.email}" khỏi sự kiện "${eventName}"?`
    )
    if (!confirmed) return

    try {
      setActionPendingId(staff.staffId)
      await deleteEventStaff(eventId, staff.staffId)
      setStaffs((prev) => prev.filter((s) => s.staffId !== staff.staffId))
      setNotice(`Đã gỡ nhân viên ${staff.fullName || staff.email} khỏi sự kiện.`)
      setTimeout(() => setNotice(''), 3000)
    } catch (cause) {
      if (cause instanceof ApiError && cause.data?.message) {
        alert(cause.data.message)
      } else {
        alert('Không thể gỡ nhân viên này. Có thể nhân viên đang trong ca trực.')
      }
    } finally {
      setActionPendingId(null)
    }
  }

  const filteredStaffs = staffs.filter(
    (s) =>
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.fullName && s.fullName.toLowerCase().includes(search.toLowerCase()))
  )

  const activeStaffCount = staffs.filter((s) => s.status === 'ACTIVE').length
  const lockedStaffCount = staffs.filter((s) => s.status !== 'ACTIVE').length

  return (
    <div className={styles.staffSection}>
      {/* 1. Top Overview Bar & Quick Actions */}
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.sectionTitle}>Quản trị Đội ngũ Soát vé</h2>
          <p className={styles.sectionSubtitle}>
            Phân công và quản lý tài khoản nhân viên soát vé cho sự kiện.
          </p>
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.btnAddStaff}
            onClick={() => {
              setModalError('')
              setEmailInput('')
              setIsModalOpen(true)
            }}
          >
            <UserPlus size={18} />
            <span>+ Phân công nhân viên mới</span>
          </button>
        </div>
      </div>

      {notice && <div className={styles.noticeBox}>{notice}</div>}
      {error && <div className={styles.errorBox}>{error}</div>}

      {/* 2. Real KPI Summary Cards */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <p className={styles.kpiLabel}>Tổng nhân viên đã phân công</p>
            <div className={styles.kpiValRow}>
              <span className={styles.kpiNumber}>{staffs.length}</span>
              <span className={styles.kpiUnit}>nhân sự</span>
            </div>
            <p className={styles.kpiSub}>Nhân sự được gán vào sự kiện</p>
          </div>
          <div className={`${styles.kpiIconBox} ${styles.iconGreen}`}>
            <Users size={24} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <p className={styles.kpiLabel}>Nhân viên đang hoạt động</p>
            <div className={styles.kpiValRow}>
              <span className={`${styles.kpiNumber} ${styles.textGreen}`}>
                {activeStaffCount}
              </span>
              <span className={styles.kpiUnit}>nhân sự</span>
            </div>
            <p className={styles.kpiSub}>Có quyền đăng nhập và quét mã vé</p>
          </div>
          <div className={`${styles.kpiIconBox} ${styles.iconMint}`}>
            <UserCheck size={24} />
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiContent}>
            <p className={styles.kpiLabel}>Tài khoản tạm khóa</p>
            <div className={styles.kpiValRow}>
              <span className={styles.kpiNumber}>{lockedStaffCount}</span>
              <span className={styles.kpiUnit}>nhân sự</span>
            </div>
            <p className={styles.kpiSub}>Tạm ngưng quyền soát vé</p>
          </div>
          <div className={`${styles.kpiIconBox} ${styles.iconMuted}`}>
            <Lock size={24} />
          </div>
        </div>
      </div>

      {/* 3. Staff Member Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Tìm tên nhân viên, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterPill}>
            <span>
              Tổng cộng: {filteredStaffs.length} / {staffs.length} nhân sự
            </span>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Nhân sự Soát vé</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Thời gian phân công</th>
                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px' }}>
                    Đang đồng bộ danh sách nhân sự soát vé...
                  </td>
                </tr>
              ) : filteredStaffs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#6d7b6f' }}>
                    {search
                      ? 'Không tìm thấy nhân viên phù hợp từ khóa tìm kiếm.'
                      : 'Chưa có nhân viên nào được phân công. Hãy nhấn "+ Phân công nhân viên mới" để thêm.'}
                  </td>
                </tr>
              ) : (
                filteredStaffs.map((staff, idx) => {
                  const isActive = staff.status === 'ACTIVE'
                  const createdDate = staff.createdAt
                    ? new Date(staff.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '—'

                  return (
                    <tr key={staff.staffId || staff.id || idx} className={styles.tableRow}>
                      <td style={{ paddingLeft: '24px' }}>
                        <div className={styles.staffUserCell}>
                          <div className={styles.avatarCircle}>
                            {(staff.fullName || staff.email || 'S').slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className={styles.staffFullName}>
                              {staff.fullName || staff.email.split('@')[0]}
                            </div>
                            <div className={styles.staffIdBadge}>
                              ID nhân sự: #{staff.staffId || staff.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={styles.emailText}>{staff.email}</span>
                      </td>

                      <td>
                        <span className={styles.phoneText}>{staff.phone || 'Chưa cập nhật'}</span>
                      </td>

                      <td>
                        <span className={styles.dateText}>{createdDate}</span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {isActive ? (
                          <span className={styles.statusActivePill}>
                            <span className={styles.dotLivePulse} />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className={styles.statusLockedPill}>
                            <span className={styles.dotGray} />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div className={styles.actionButtonsRow}>
                          <button
                            type="button"
                            className={isActive ? styles.btnActionLock : styles.btnActionUnlock}
                            title={isActive ? 'Khóa quyền soát vé của nhân viên này' : 'Mở khóa quyền soát vé'}
                            disabled={actionPendingId === staff.staffId}
                            onClick={() => handleToggleStatus(staff)}
                          >
                            {isActive ? <Lock size={18} /> : <Unlock size={18} />}
                          </button>

                          <button
                            type="button"
                            className={styles.btnActionDelete}
                            title="Gỡ nhân viên khỏi sự kiện"
                            disabled={actionPendingId === staff.staffId}
                            onClick={() => handleDeleteStaff(staff)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal: Phân công nhân viên mới */}
      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <div className={styles.modalIconBox}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className={styles.modalTitle}>Phân công nhân viên mới</h3>
                  <p className={styles.modalSubtitle}>
                    Cấp tài khoản và quyền soát vé cho nhân viên sự kiện
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.btnCloseModal}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className={styles.modalForm}>
              {modalError && (
                <div className={styles.modalAlert}>
                  <span>{modalError}</span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Email tài khoản nhân viên <span style={{ color: '#ba1a1a' }}>*</span>
                </label>
                <div className={styles.inputWithIcon}>
                  <Mail size={18} className={styles.inputIcon} />
                  <input
                    type="email"
                    required
                    placeholder="Ví dụ: staff@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className={styles.inputControl}
                  />
                </div>
                <p className={styles.formHint}>
                  Nhân viên cần có tài khoản trong hệ thống để đăng nhập ứng dụng quét mã.
                </p>
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
                  disabled={modalLoading}
                  className={styles.btnModalSubmit}
                >
                  <UserCheck size={18} />
                  <span>{modalLoading ? 'Đang phân công...' : 'Xác nhận phân công'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
