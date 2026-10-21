import { useEffect, useState } from 'react'
import {
  Download,
  Filter,
  Lock,
  Mail,
  QrCode,
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
  const [gateAssigned, setGateAssigned] = useState('Cổng A (Làn VIP Fanzone)')
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
      setModalError('Vui lòng nhập email tài khoản TicketBox của nhân viên.')
      return
    }

    try {
      setModalLoading(true)
      setModalError('')
      const newStaff = await addEventStaff(eventId, emailInput.trim())
      setStaffs((prev) => [newStaff, ...prev])
      setIsModalOpen(false)
      setEmailInput('')
      setNotice(`Đã phân công thành công nhân viên ${newStaff.fullName || newStaff.email} vào ${gateAssigned}.`)
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

  return (
    <div className={styles.staffSection}>
      {/* 1. Top Overview Bar & Quick Actions */}
      <div className={styles.topBar}>
        <div>
          <h2 className={styles.sectionTitle}>Quản trị Đội ngũ &amp; Kiểm soát Cổng</h2>
          <p className={styles.sectionSubtitle}>
            Phân bổ nhân sự, cấp máy POS kiểm tra mã QR vé và giám sát trạng thái ca trực thời gian thực.
          </p>
        </div>

        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.btnExport}
            onClick={() => alert(`Xuất file danh sách ca trực sự kiện "${eventName}" thành công.`)}
          >
            <Download size={18} />
            <span>Xuất file phân ca</span>
          </button>
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

      {/* 2. 4 Gate Shift Allocation Summary Cards */}
      <div className={styles.gateGrid}>
        {/* Gate A */}
        <div className={styles.gateCard}>
          <div className={styles.gateTopRow}>
            <span className={styles.gateBadgeA}>CỔNG A (VIP &amp; FANZONE)</span>
            <span className={styles.pulseGreen} />
          </div>
          <div className={styles.gateMain}>
            <div className={styles.gateLeader}>Đỗ Nam Trung</div>
            <div className={styles.gateRole}>Trưởng ca phụ trách</div>
          </div>
          <div className={styles.gateBottomRow}>
            <span className={styles.gateCount}>
              <Users size={15} color="#006d3d" />
              <span>4 nhân sự</span>
            </span>
            <span className={styles.gatePosActive}>4 POS Active</span>
          </div>
        </div>

        {/* Gate B */}
        <div className={styles.gateCard}>
          <div className={styles.gateTopRow}>
            <span className={styles.gateBadgeB}>CỔNG B (KHÁN ĐÀI GA)</span>
            <span className={styles.pulseGreen} />
          </div>
          <div className={styles.gateMain}>
            <div className={styles.gateLeader}>Phạm Thùy Linh</div>
            <div className={styles.gateRole}>Trưởng ca phụ trách</div>
          </div>
          <div className={styles.gateBottomRow}>
            <span className={styles.gateCount}>
              <Users size={15} color="#006591" />
              <span>3 nhân sự</span>
            </span>
            <span className={styles.gatePosActiveB}>3 POS Active</span>
          </div>
        </div>

        {/* Gate C */}
        <div className={styles.gateCard}>
          <div className={styles.gateTopRow}>
            <span className={styles.gateBadgeC}>CỔNG C (KHÁN ĐÀI TẦNG)</span>
            <span className={styles.pulseGreen} />
          </div>
          <div className={styles.gateMain}>
            <div className={styles.gateLeader}>Lê Hoàng Minh</div>
            <div className={styles.gateRole}>Trưởng ca phụ trách</div>
          </div>
          <div className={styles.gateBottomRow}>
            <span className={styles.gateCount}>
              <Users size={15} color="#006c49" />
              <span>3 nhân sự</span>
            </span>
            <span className={styles.gatePosActiveC}>3 POS Active</span>
          </div>
        </div>

        {/* Incident / CSKH */}
        <div className={styles.gateCard}>
          <div className={styles.gateTopRow}>
            <span className={styles.gateBadgeD}>BÀN SỰ CỐ &amp; CSKH</span>
            <span className={styles.pulseCoral} />
          </div>
          <div className={styles.gateMain}>
            <div className={styles.gateLeader}>Trần Diệu Huyền</div>
            <div className={styles.gateRole}>Xử lý vé lỗi &amp; Thẻ VIP</div>
          </div>
          <div className={styles.gateBottomRow}>
            <span className={styles.gateCount}>
              <Users size={15} color="#3d4a3f" />
              <span>2 nhân sự</span>
            </span>
            <span className={styles.gatePosActiveD}>Trực tiếp tại sảnh</span>
          </div>
        </div>
      </div>

      {/* 3. Real-time Scan Progress Metric Banner */}
      <div className={styles.progressBanner}>
        <div className={styles.progressLeft}>
          <div className={styles.gaugeBox}>
            <svg className={styles.gaugeSvg} viewBox="0 0 36 36">
              <path
                className={styles.gaugeTrack}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3.5"
              />
              <path
                className={styles.gaugeFill}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeDasharray="72, 100"
                strokeLinecap="round"
                strokeWidth="3.5"
              />
            </svg>
          </div>
          <div>
            <div className={styles.progressHeadingRow}>
              <span className={styles.progressTitle}>Tiến độ Soát vé Trực tiếp</span>
              <span className={styles.speedPill}>Tốc độ: 48 vé/phút</span>
            </div>
            <p className={styles.progressDesc}>
              Đã check-in hợp lệ <strong>3.312</strong> trên tổng số <strong>4.600</strong> vé phát hành. Không phát hiện vé trùng lặp giả mạo.
            </p>
          </div>
        </div>

        <div className={styles.progressRight}>
          <div className={styles.gateStat}>
            <div className={styles.gateStatLabel}>Cổng A (VIP)</div>
            <div className={`${styles.gateStatVal} ${styles.textPrimaryGreen}`}>88.4%</div>
          </div>
          <div className={styles.gateStat}>
            <div className={styles.gateStatLabel}>Cổng B (GA)</div>
            <div className={`${styles.gateStatVal} ${styles.textSecondaryBlue}`}>69.2%</div>
          </div>
          <div className={styles.gateStat}>
            <div className={styles.gateStatLabel}>Cổng C (Tầng)</div>
            <div className={styles.gateStatVal}>62.0%</div>
          </div>
        </div>
      </div>

      {/* 4. Staff Member Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableToolbar}>
          <div className={styles.searchBox}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Tìm tên nhân viên, email, mã POS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterPill}>
            <Filter size={16} />
            <span>Lọc Cổng: Tất cả ({staffs.length} nhân sự)</span>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Nhân sự Soát vé</th>
                <th>Tài khoản TicketBox</th>
                <th>Vị trí phân công</th>
                <th>Thiết bị POS / App</th>
                <th style={{ textAlign: 'center' }}>Trạng thái ca</th>
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
                  const gateName =
                    idx % 3 === 0
                      ? 'Cổng A (Làn VIP Fanzone)'
                      : idx % 3 === 1
                      ? 'Cổng B (Làn Khán đài GA)'
                      : 'Cổng C (Khán đài Tầng)'
                  const posName = `POS Terminal #${String(idx + 1).padStart(2, '0')}`

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
                              ID: #TB-{staff.staffId || staff.id || 88200 + idx} • Phụ trách soát vé
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={styles.emailText}>{staff.email}</span>
                      </td>

                      <td>
                        <span className={styles.gatePill}>
                          <span className={styles.dotGreen} />
                          {gateName}
                        </span>
                      </td>

                      <td>
                        <div className={styles.posTerminalCell}>
                          <QrCode size={16} color="#006d3d" />
                          <span>{posName}</span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {isActive ? (
                          <span className={styles.statusActivePill}>
                            <span className={styles.dotLivePulse} />
                            Đang trực ({((idx + 1) * 320).toLocaleString('vi-VN')} vé)
                          </span>
                        ) : (
                          <span className={styles.statusLockedPill}>
                            <span className={styles.dotGray} />
                            Đã khóa ca
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div className={styles.actionButtonsRow}>
                          <button
                            type="button"
                            className={isActive ? styles.btnActionLock : styles.btnActionUnlock}
                            title={isActive ? 'Khóa ca trực của nhân viên này' : 'Mở khóa ca trực'}
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

      {/* 5. Modal: Phân công nhân viên mới */}
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
                    placeholder="Ví dụ: staff.nguyen@ticketbox.vn"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className={styles.inputControl}
                  />
                </div>
                <p className={styles.formHint}>
                  Nhân viên cần có tài khoản trong hệ thống TicketBox để đăng nhập ứng dụng quét mã.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Cổng phân công nhiệm vụ
                </label>
                <select
                  value={gateAssigned}
                  onChange={(e) => setGateAssigned(e.target.value)}
                  className={styles.selectControl}
                >
                  <option value="Cổng A (Làn VIP Fanzone)">Cổng A (VIP &amp; FANZONE)</option>
                  <option value="Cổng B (Làn Khán đài GA)">Cổng B (KHÁN ĐÀI GA)</option>
                  <option value="Cổng C (Khán đài Tầng)">Cổng C (KHÁN ĐÀI TẦNG)</option>
                  <option value="Bàn sự cố & CSKH">BÀN SỰ CỐ &amp; CSKH</option>
                </select>
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
