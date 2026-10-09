import styles from './CustomerFooter.module.css';

const currentYear = new Date().getFullYear();

export function CustomerFooter() {
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerInner}>
        <div className={styles.footerBottom}>
          <p>© {currentYear} EventHub. Toàn bộ quyền được bảo lưu.</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Điều khoản sử dụng</span>
            <span>Chính sách bảo mật</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
