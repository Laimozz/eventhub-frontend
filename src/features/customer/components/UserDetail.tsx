import type { UserDetailDto } from '../types/user';
import styles from '../pages/UserDetailPage.module.css';

interface UserDetailProps {
  user: UserDetailDto;
  onEdit: () => void;
}

export function UserDetail({ user, onEdit }: UserDetailProps) {
  const roleDisplay = user.role === 'CUSTOMER' ? 'Khách mua vé / Customer' : user.role;
  const initial = user.fullName?.trim() ? user.fullName.trim().charAt(0).toUpperCase() : 'U';

  return (
    <div className={styles.profileCard}>
      {/* Hero Master Profile Section */}
      <div className={styles.heroProfileRow}>
        <div className={styles.avatarLargeWrapper}>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName}
              className={styles.avatarLarge}
            />
          ) : (
            <div className={styles.avatarLarge}>
              <span>{initial}</span>
            </div>
          )}
        </div>

        <div className={styles.heroInfo}>
          <div className={styles.heroHeaderRow}>
            <div>
              <h2 className={styles.heroName}>{user.fullName}</h2>
              <p className={styles.heroSub}>Tài khoản đặt vé sự kiện cá nhân</p>
            </div>
            <button
              type="button"
              className={styles.btnSecondaryEdit}
              onClick={onEdit}
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span>Chỉnh sửa thông tin cá nhân</span>
            </button>
          </div>

          <div className={styles.quickInfoRow}>
            <div className={styles.quickInfoItem}>
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span>{user.email}</span>
            </div>
            <div className={styles.quickInfoItem}>
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>{user.phone || 'Chưa cập nhật'}</span>
            </div>
            <div className={`${styles.quickInfoItem} ${styles.roleTagHighlight}`}>
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>{roleDisplay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Divider */}
      <div className={styles.cardDivider} />

      {/* Detail Attributes Grid */}
      <div>
        <h3 className={styles.sectionTitle}>Chi tiết thông tin cá nhân</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoTile}>
            <span className={styles.tileLabel}>Họ và tên</span>
            <p className={styles.tileValue}>{user.fullName}</p>
          </div>

          <div className={styles.infoTile}>
            <span className={styles.tileLabel}>Địa chỉ Email</span>
            <p className={styles.tileValue} title={user.email}>{user.email}</p>
          </div>

          <div className={styles.infoTile}>
            <span className={styles.tileLabel}>Số điện thoại</span>
            <p className={styles.tileValue}>{user.phone || 'Chưa cập nhật'}</p>
          </div>

          <div className={styles.infoTile}>
            <span className={styles.tileLabel}>Ngày sinh</span>
            <p className={styles.tileValue}>
              {user.dateOfBirth ? (
                user.dateOfBirth.includes('-')
                  ? user.dateOfBirth.split('-').reverse().join('/')
                  : user.dateOfBirth
              ) : 'Chưa cập nhật'}
            </p>
          </div>

          <div className={styles.infoTile}>
            <span className={styles.tileLabel}>Giới tính</span>
            <p className={styles.tileValue}>{user.gender || 'Nam'}</p>
          </div>

          <div className={styles.infoTile}>
            <span className={styles.tileLabel}>Vai trò tài khoản</span>
            <p className={`${styles.tileValue} ${styles.primary}`}>{roleDisplay}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

