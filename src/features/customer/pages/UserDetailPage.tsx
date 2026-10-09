import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import type { UserDetailDto } from '../types/user';
import { getUserDetail } from '../api/user-api';
import { userErrorMessage } from '../api/user-errors';
import { UserDetail } from '../components/UserDetail';
import { EditUserDetail } from '../components/EditUserDetail';
import { ChangePassword } from '../components/ChangePassword';
import { CustomerHeader } from '../components/CustomerHeader';
import { CustomerFooter } from '../components/CustomerFooter';
import { Toast, type ToastData } from '../components/Toast';
import { UserPageHeader, type PageMode } from '../components/UserPageHeader';
import styles from './UserDetailPage.module.css';

export function UserDetailPage() {
  const { user: authUser } = useAuth();

  const [mode, setMode] = useState<PageMode>('VIEW');
  const [user, setUser] = useState<UserDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      setPageError(null);
      try {
        const data = await getUserDetail();
        if (mounted) {
          setUser(data);
        }
      } catch (err: unknown) {
        if (mounted) {
          if (authUser) {
            setUser({
              id: authUser.id,
              fullName: authUser.fullName || '',
              email: authUser.email,
              phone: authUser.phone || '',
              role: authUser.role as UserDetailDto['role'],
              status: 'ACTIVE',
              dateOfBirth: '15/08/1996',
              gender: 'Nam',
              avatarUrl: null,
            });
          } else {
            setPageError(userErrorMessage(err));
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [authUser]);

  function showToast(type: 'success' | 'error', title: string, message: string) {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  }

  const currentUser: UserDetailDto | null = user || (authUser ? {
    id: authUser.id,
    fullName: authUser.fullName || '',
    email: authUser.email,
    phone: authUser.phone || '',
    role: authUser.role as UserDetailDto['role'],
    status: 'ACTIVE',
    dateOfBirth: '15/08/1996',
    gender: 'Nam',
    avatarUrl: null,
  } : null);

  return (
    <div className={styles.pageWrapper}>
      {/* Toast Notification Alert */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header & Account Menu */}
      <CustomerHeader
        user={currentUser}
        onSelectMode={(targetMode) => setMode(targetMode)}
      />

      {/* Main Body */}
      <main className={styles.mainContent}>
        <UserPageHeader mode={mode} onSetMode={setMode} />

        {/* State Display: Loading / Error / Active View Component */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6d7b6f' }}>
            <p>Đang tải thông tin cá nhân…</p>
          </div>
        ) : pageError ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#ba1a1a' }}>
            <p>{pageError}</p>
            <button
              type="button"
              className={styles.btnCancel}
              style={{ marginTop: '16px' }}
              onClick={() => window.location.reload()}
            >
              Tải lại trang
            </button>
          </div>
        ) : currentUser ? (
          mode === 'VIEW' ? (
            <UserDetail
              user={currentUser}
              onEdit={() => setMode('EDIT')}
            />
          ) : mode === 'EDIT' ? (
            <EditUserDetail
              user={currentUser}
              onCancel={() => setMode('VIEW')}
              onChangePassword={() => setMode('CHANGE_PASSWORD')}
              onAvatarUpdated={(newAvatarUrl) => {
                setUser((prev) => (prev ? { ...prev, avatarUrl: newAvatarUrl } : null));
              }}
              onSuccess={(updatedUser) => {
                setUser(updatedUser);
                setMode('VIEW');
                showToast(
                  'success',
                  'Cập nhật thông tin thành công!',
                  'Hồ sơ của bạn đã được cập nhật trên toàn hệ thống.',
                );
              }}
              onError={(errorMsg) => {
                showToast('error', 'Cập nhật thất bại', errorMsg);
              }}
              onShowNotice={(infoMsg) => {
                showToast('success', 'Thông báo', infoMsg);
              }}
            />
          ) : (
            <ChangePassword
              user={currentUser}
              onCancel={() => setMode('VIEW')}
              onSuccess={() => {
                setMode('VIEW');
                showToast(
                  'success',
                  'Đổi mật khẩu thành công!',
                  'Mật khẩu mới của bạn đã được lưu an toàn.',
                );
              }}
              onError={(errorMsg) => {
                showToast('error', 'Đổi mật khẩu thất bại', errorMsg);
              }}
              onShowNotice={(infoMsg) => {
                showToast('success', 'Thông báo', infoMsg);
              }}
            />
          )
        ) : null}
      </main>

      {/* Footer */}
      <CustomerFooter />
    </div>
  );
}
