import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import type { UserDetailDto } from '../types/user';
import { changePassword } from '../api/user-api';
import { userErrorMessage, userFieldErrors } from '../api/user-errors';
import styles from './ChangePassword.module.css';

interface ChangePasswordProps {
  user: UserDetailDto;
  onCancel: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
  onShowNotice?: (msg: string) => void;
}

export function ChangePassword({
  user,
  onCancel,
  onSuccess,
  onError,
  onShowNotice,
}: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Password rules validation
  const rules = useMemo(() => {
    return {
      hasLength: newPassword.length >= 8,
      hasNumber: /\d/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
    };
  }, [newPassword]);

  // Strength score: 0 to 4
  const strengthScore = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (rules.hasLength) score += 1;
    if (rules.hasNumber) score += 1;
    if (rules.hasSpecial) score += 1;
    if (rules.hasUpper && rules.hasLower) score += 1;
    return score;
  }, [newPassword, rules]);

  const strengthMeta = useMemo(() => {
    switch (strengthScore) {
      case 1:
        return { text: 'Yếu', color: '#ba1a1a', activeClass: styles.activeWeak };
      case 2:
        return { text: 'Trung bình', color: '#e67e22', activeClass: styles.activeMedium };
      case 3:
        return { text: 'Khá', color: '#f39c12', activeClass: styles.activeGood };
      case 4:
        return { text: 'Mạnh', color: '#006d3d', activeClass: styles.activeStrong };
      default:
        return { text: 'Chưa nhập', color: '#6d7b6f', activeClass: '' };
    }
  }, [strengthScore]);

  const isMatching = useMemo(() => {
    if (!confirmPassword) return null;
    return newPassword === confirmPassword;
  }, [newPassword, confirmPassword]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;

    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.currentPassword = 'Mật khẩu hiện tại không được để trống.';
    }

    if (!newPassword) {
      errors.newPassword = 'Mật khẩu mới không được để trống.';
    } else if (newPassword.length < 8 || newPassword.length > 72) {
      errors.newPassword = 'Mật khẩu mới phải từ 8 đến 72 ký tự.';
    } else if (strengthScore < 3) {
      errors.newPassword = 'Mật khẩu mới phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng nhập lại mật khẩu mới để xác nhận.';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPending(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFieldErrors({});
      onSuccess();
    } catch (err: unknown) {
      const serverFieldErrors = userFieldErrors(err);
      if (serverFieldErrors) {
        setFieldErrors(serverFieldErrors);
      }
      const msg = userErrorMessage(err);
      onError(msg);
    } finally {
      setPending(false);
    }
  }

  const initial = user.fullName?.trim() ? user.fullName.trim().charAt(0).toUpperCase() : 'U';

  return (
    <div className={styles.changePasswordContainer}>
      <div className={styles.layoutGrid}>
        {/* Left Column: Sidebar context */}
        <aside className={styles.sidebarCol}>
          {/* User Identity Mini Card */}
          <div className={styles.sidebarCard}>
            <div className={styles.userMiniProfile}>
              <div className={styles.avatarMiniWrapper}>
                <div className={styles.avatarMini}>
                  <span>{initial}</span>
                </div>
                <span className={styles.verifiedBadge}>
                  <span className="material-symbols-outlined text-[10px]">check</span>
                </span>
              </div>
              <div className={styles.userMiniInfo}>
                <h2 className={styles.userMiniName}>{user.fullName || 'Người dùng'}</h2>
                <p className={styles.userMiniEmail}>{user.email}</p>
              </div>
            </div>

            <div className={styles.twoFaBadge}>
              <div className={styles.twoFaIconBox}>
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <div>
                <p className={styles.twoFaTitle}>Xác thực 2 lớp khả dụng</p>
                <p className={styles.twoFaSub}>SMS OTP / EventHub Pass</p>
              </div>
            </div>
          </div>

          {/* Security History Card */}
          <div className={styles.sidebarCard}>
            <div className={styles.securityCardHeader}>
              <span className="material-symbols-outlined text-[22px]">lock_clock</span>
              <h3 className={styles.securityCardTitle}>Lịch sử an toàn</h3>
            </div>
            <p className={styles.securityCardDesc}>
              Lần đổi mật khẩu gần nhất của bạn là <strong style={{ color: '#191c1e' }}>45 ngày trước</strong>. Các chuyên gia bảo mật khuyên nên làm mới định kỳ mỗi 90 ngày.
            </p>

            <div className={styles.trustScoreBox}>
              <span className={styles.scoreLabel}>Độ tin cậy tài khoản</span>
              <span className={styles.scoreValue}>98/100</span>
            </div>

            <div className={styles.securityTipBox}>
              <span className="material-symbols-outlined text-[18px]" style={{ color: '#006d3d', flexShrink: 0 }}>
                lightbulb
              </span>
              <span>Không nên tái sử dụng mật khẩu của các nền tảng mạng xã hội hoặc email cá nhân.</span>
            </div>
          </div>
        </aside>

        {/* Right Column: Change Password Form */}
        <section className={styles.formCol}>
          <div className={styles.passwordCard}>
            <div className={styles.formHeaderCategory}>
              <span className="material-symbols-outlined text-[18px]">security_update_good</span>
              <span>Thiết lập bảo vệ</span>
            </div>
            <h1 className={styles.formMainTitle}>Đổi mật khẩu</h1>
            <p className={styles.formMainSub}>
              Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu của bạn với bất kỳ ai khác.
            </p>

            {/* Highlight Policy Box */}
            <div className={styles.policyAlertBox}>
              <div className={styles.policyIconCircle}>
                <span className="material-symbols-outlined text-[20px]">shield</span>
              </div>
              <div>
                <h4 className={styles.policyTitle}>Khuyến nghị tiêu chuẩn bảo vệ</h4>
                <p className={styles.policyText}>
                  Mật khẩu nên có tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt để đảm bảo an toàn tối đa cho vé và giao dịch tài chính.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Field 1: Current Password */}
              <div className={styles.formGroup}>
                <div className={styles.fieldLabelRow}>
                  <label htmlFor="currentPassword" className={styles.fieldLabel}>
                    Mật khẩu hiện tại <span className={styles.requiredStar}>*</span>
                  </label>
                  <button
                    type="button"
                    className={styles.forgotLink}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onClick={() => onShowNotice && onShowNotice('Vui lòng liên hệ quản trị viên hoặc sử dụng tính năng Quên mật khẩu tại trang đăng nhập.')}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className={styles.inputWrapper}>
                  <span className={`material-symbols-outlined ${styles.inputIcon}`}>key</span>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrent ? 'text' : 'password'}
                    className={`${styles.passwordInput} ${fieldErrors.currentPassword ? styles.invalid : ''}`}
                    placeholder="Nhập mật khẩu đang sử dụng"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (fieldErrors.currentPassword) setFieldErrors((prev) => ({ ...prev, currentPassword: '' }));
                    }}
                    disabled={pending}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeToggleBtn}
                    onClick={() => setShowCurrent(!showCurrent)}
                    aria-label="Ẩn/hiện mật khẩu hiện tại"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showCurrent ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {fieldErrors.currentPassword && (
                  <p className={styles.fieldErrorText}>
                    <span className="material-symbols-outlined text-[15px]">error</span>
                    {fieldErrors.currentPassword}
                  </p>
                )}
              </div>

              {/* Field 2: New Password */}
              <div className={styles.formGroup}>
                <div className={styles.fieldLabelRow}>
                  <label htmlFor="newPassword" className={styles.fieldLabel}>
                    Mật khẩu mới <span className={styles.requiredStar}>*</span>
                  </label>
                </div>
                <div className={styles.inputWrapper}>
                  <span className={`material-symbols-outlined ${styles.inputIcon}`}>lock</span>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showNew ? 'text' : 'password'}
                    className={`${styles.passwordInput} ${fieldErrors.newPassword ? styles.invalid : ''}`}
                    placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                    }}
                    disabled={pending}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeToggleBtn}
                    onClick={() => setShowNew(!showNew)}
                    aria-label="Ẩn/hiện mật khẩu mới"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showNew ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {fieldErrors.newPassword && (
                  <p className={styles.fieldErrorText}>
                    <span className="material-symbols-outlined text-[15px]">error</span>
                    {fieldErrors.newPassword}
                  </p>
                )}

                {/* Password Strength Meter */}
                <div className={styles.strengthMeterBox}>
                  <div className={styles.strengthHeader}>
                    <span className={styles.strengthLabel}>Độ mạnh mật khẩu:</span>
                    <span
                      className={styles.strengthRatingText}
                      style={{ color: strengthMeta.color }}
                    >
                      {strengthMeta.text}
                    </span>
                  </div>

                  <div className={styles.strengthBars}>
                    <div className={`${styles.strengthBarItem} ${strengthScore >= 1 ? strengthMeta.activeClass : ''}`} />
                    <div className={`${styles.strengthBarItem} ${strengthScore >= 2 ? strengthMeta.activeClass : ''}`} />
                    <div className={`${styles.strengthBarItem} ${strengthScore >= 3 ? strengthMeta.activeClass : ''}`} />
                    <div className={`${styles.strengthBarItem} ${strengthScore >= 4 ? strengthMeta.activeClass : ''}`} />
                  </div>

                  <div className={styles.rulesList}>
                    <div className={`${styles.ruleItem} ${rules.hasLength ? styles.fulfilled : ''}`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {rules.hasLength ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Ít nhất 8 ký tự</span>
                    </div>
                    <div className={`${styles.ruleItem} ${rules.hasNumber ? styles.fulfilled : ''}`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {rules.hasNumber ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Có số (0-9)</span>
                    </div>
                    <div className={`${styles.ruleItem} ${rules.hasSpecial ? styles.fulfilled : ''}`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {rules.hasSpecial ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>Ký tự đặc biệt (@, #, $)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Field 3: Confirm New Password */}
              <div className={styles.formGroup}>
                <div className={styles.fieldLabelRow}>
                  <label htmlFor="confirmPassword" className={styles.fieldLabel}>
                    Xác nhận mật khẩu mới <span className={styles.requiredStar}>*</span>
                  </label>
                </div>
                <div className={styles.inputWrapper}>
                  <span className={`material-symbols-outlined ${styles.inputIcon}`}>lock_reset</span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    className={`${styles.passwordInput} ${fieldErrors.confirmPassword ? styles.invalid : ''}`}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    disabled={pending}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeToggleBtn}
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label="Ẩn/hiện xác nhận mật khẩu"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirm ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className={styles.fieldErrorText}>
                    <span className="material-symbols-outlined text-[15px]">error</span>
                    {fieldErrors.confirmPassword}
                  </p>
                )}

                {/* Match Indicator */}
                {isMatching !== null && (
                  <div className={`${styles.matchBadge} ${isMatching ? styles.matched : styles.unmatched}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {isMatching ? 'check_circle' : 'cancel'}
                    </span>
                    <span>
                      {isMatching ? 'Mật khẩu hoàn toàn trùng khớp' : 'Mật khẩu xác nhận chưa khớp'}
                    </span>
                  </div>
                )}
              </div>

              {/* Note */}
              <div className={styles.sessionNoteRow}>
                <span className="material-symbols-outlined text-[18px]">devices</span>
                <span>Sau khi đổi mật khẩu, bạn vẫn duy trì đăng nhập trên thiết bị này.</span>
              </div>

              {/* Actions */}
              <div className={styles.formActionsRow}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={onCancel}
                  disabled={pending}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={pending}
                >
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  <span>{pending ? 'Đang lưu…' : 'Lưu thay đổi & Cập nhật mật khẩu'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Bento Cards */}
          <div className={styles.bottomBentoRow}>
            <div className={styles.bentoCard}>
              <div className={styles.bentoLeft}>
                <div className={styles.bentoIconBox}>
                  <span className="material-symbols-outlined text-[24px]">laptop_mac</span>
                </div>
                <div>
                  <h4 className={styles.bentoTitle}>Thiết bị hiện tại</h4>
                  <p className={styles.bentoSub}>Chrome • Windows TP. Hồ Chí Minh</p>
                  <span className={styles.bentoActiveTag}>Đang hoạt động</span>
                </div>
              </div>
            </div>

            <div className={styles.bentoCard}>
              <div className={styles.bentoLeft}>
                <div className={`${styles.bentoIconBox} ${styles.secondary}`}>
                  <span className="material-symbols-outlined text-[24px]">help_center</span>
                </div>
                <div>
                  <h4 className={styles.bentoTitle}>Cần sự hỗ trợ?</h4>
                  <p className={styles.bentoSub}>Gặp sự cố khi đăng nhập?</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.btnContact}
                onClick={() => onShowNotice && onShowNotice('Đội ngũ hỗ trợ EventHub luôn sẵn sàng qua email: support@eventhub.vn')}
              >
                Liên hệ
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
