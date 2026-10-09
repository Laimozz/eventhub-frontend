import styles from './Toast.module.css';

export interface ToastData {
  type: 'success' | 'error';
  title: string;
  message: string;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  if (!toast) return null;

  return (
    <div className={styles.toastContainer} role="alert">
      <div className={styles.toastInner}>
        <div className={`${styles.toastIconCircle} ${styles[toast.type]}`}>
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
        </div>
        <div className={styles.toastContent}>
          <h4 className={styles.toastTitle}>{toast.title}</h4>
          <p className={styles.toastMessage}>{toast.message}</p>
        </div>
        <button
          type="button"
          className={styles.toastCloseBtn}
          onClick={onClose}
          aria-label="Đóng thông báo"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
}
