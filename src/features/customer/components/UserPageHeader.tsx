import { Link } from 'react-router';
import styles from './UserPageHeader.module.css';

export type PageMode = 'VIEW' | 'EDIT' | 'CHANGE_PASSWORD';

interface UserPageHeaderProps {
  mode: PageMode;
  onSetMode: (mode: PageMode) => void;
}

export function UserPageHeader({ mode, onSetMode }: UserPageHeaderProps) {
  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/">
          <span className="material-symbols-outlined text-[16px]">home</span>
          Trang chủ
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>

        {mode === 'VIEW' ? (
          <span className={styles.breadcrumbCurrent}>Thông tin cá nhân</span>
        ) : mode === 'EDIT' ? (
          <>
            <button
              type="button"
              className={styles.breadcrumbBtn}
              onClick={() => onSetMode('VIEW')}
            >
              Hồ sơ cá nhân
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className={styles.breadcrumbCurrent}>Chỉnh sửa</span>
          </>
        ) : (
          <>
            <button
              type="button"
              className={styles.breadcrumbBtn}
              onClick={() => onSetMode('VIEW')}
            >
              Hồ sơ cá nhân
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className={styles.breadcrumbCurrent}>Đổi mật khẩu</span>
          </>
        )}
      </nav>

      {/* Page Headline with Mode specific texts */}
      {mode === 'VIEW' ? (
        <div className={styles.pageHeadline}>
          <div>
            <h1 className={styles.headlineTitle}>Thông tin cá nhân</h1>
            <p className={styles.headlineSub}>
              Quản lý và cập nhật thông tin tài khoản người dùng EventHub
            </p>
          </div>
          <div>
            <button
              type="button"
              className={styles.btnPrimaryAction}
              onClick={() => onSetMode('EDIT')}
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              <span>Chỉnh sửa thông tin cá nhân</span>
            </button>
          </div>
        </div>
      ) : mode === 'EDIT' ? (
        <div className={styles.pageHeadline}>
          <div>
            <div className={styles.verifiedBadge}>
              <span className={styles.pulseDot} />
              TÀI KHOẢN XÁC MINH
            </div>
            <h1 className={styles.headlineTitle}>Chỉnh sửa hồ sơ cá nhân</h1>
            <p className={styles.headlineSub}>
              Cập nhật thông tin cá nhân và quản lý tài khoản thành viên EventHub.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.pageHeadline}>
          <div>
            <div className={styles.verifiedBadge}>
              <span className={styles.pulseDot} />
              THIẾT LẬP BẢO VỆ
            </div>
            <h1 className={styles.headlineTitle}>Đổi mật khẩu tài khoản</h1>
            <p className={styles.headlineSub}>
              Thay đổi mật khẩu định kỳ giúp bảo vệ tài khoản và vé sự kiện của bạn.
            </p>
          </div>
          <div>
            <button
              type="button"
              className={styles.btnBackProfile}
              onClick={() => onSetMode('VIEW')}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Quay lại hồ sơ</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
