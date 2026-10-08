import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import type { UserDetailDto } from '../types/user';
import { updateUserDetail, uploadAvatar } from '../api/user-api';
import { userErrorMessage, userFieldErrors } from '../api/user-errors';
import styles from '../pages/UserDetailPage.module.css';

const EMAIL_REGEX = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_REGEX = /^(?:\+84|0)[35789]\d{8}$/;
const TODAY_ISO = new Date().toISOString().split('T')[0];

interface EditUserDetailProps {
  user: UserDetailDto;
  onCancel: () => void;
  onSuccess: (updatedUser: UserDetailDto) => void;
  onError: (message: string) => void;
  onShowNotice?: (message: string) => void;
  onChangePassword?: () => void;
  onAvatarUpdated?: (newAvatarUrl: string) => void;
}

export function EditUserDetail({
  user,
  onCancel,
  onSuccess,
  onError,
  onShowNotice,
  onChangePassword,
  onAvatarUpdated,
}: EditUserDetailProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fullName, setFullName] = useState(user.fullName || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [birthDate, setBirthDate] = useState(user.dateOfBirth || '');
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState(['5', '8', '2', '', '', '']);

  const roleDisplay = user.role === 'CUSTOMER' ? 'Khách mua vé / Customer' : user.role;
  const initial = user.fullName?.trim() ? user.fullName.trim().charAt(0).toUpperCase() : 'U';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const errors: Record<string, string> = {};
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const cleanPhone = trimmedPhone.replace(/[\s.-]/g, '');

    if (!trimmedName) {
      errors.fullName = 'Họ và tên không được để trống.';
    } else if (trimmedName.length > 255) {
      errors.fullName = 'Họ và tên không được vượt quá 255 ký tự.';
    }

    if (!trimmedEmail) {
      errors.email = 'Email không được để trống.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Email không đúng định dạng (ví dụ: example@domain.com).';
    } else if (trimmedEmail.length > 255) {
      errors.email = 'Email không được vượt quá 255 ký tự.';
    }

    if (!trimmedPhone) {
      errors.phone = 'Số điện thoại không được để trống.';
    } else if (!PHONE_REGEX.test(cleanPhone)) {
      errors.phone = 'Số điện thoại không đúng định dạng (gồm 10 chữ số, ví dụ: 0908123456).';
    }

    if (birthDate) {
      const selectedDate = new Date(birthDate);
      const today = new Date();
      if (selectedDate > today) {
        errors.birthDate = 'Ngày sinh phải trước ngày hiện tại.';
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setPending(true);
    try {
      const updated = await updateUserDetail({
        fullName: trimmedName,
        email: trimmedEmail.toLowerCase(),
        phone: cleanPhone,
        dateOfBirth: birthDate || null,
      });
      onSuccess({ ...updated, avatarUrl: avatarUrl || updated.avatarUrl });
    } catch (err: unknown) {
      const serverFieldErrors = userFieldErrors(err);
      if (serverFieldErrors) {
        if (serverFieldErrors.dateOfBirth && !serverFieldErrors.birthDate) {
          serverFieldErrors.birthDate = serverFieldErrors.dateOfBirth;
        }
        setFieldErrors(serverFieldErrors);
      }
      const msg = userErrorMessage(err);
      onError(msg);
    } finally {
      setPending(false);
    }
  }

  async function handleFileSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      onError('Định dạng ảnh không hợp lệ. Vui lòng chọn tệp định dạng JPG hoặc PNG.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onError('Kích thước ảnh vượt quá 5MB. Vui lòng chọn tệp nhỏ hơn.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file, user.id);
      setAvatarUrl(res.avatarUrl);
      if (onAvatarUpdated) {
        onAvatarUpdated(res.avatarUrl);
      }
      if (onShowNotice) {
        onShowNotice('Cập nhật ảnh đại diện thành công!');
      }
    } catch (err: unknown) {
      const msg = userErrorMessage(err);
      onError(msg || 'Tải lên ảnh đại diện thất bại. Vui lòng thử lại.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleTriggerFileInput() {
    fileInputRef.current?.click();
  }

  function handleDeleteAvatar() {
    if (onShowNotice) {
      onShowNotice('Tính năng gỡ ảnh đại diện sẽ được hỗ trợ trong phiên bản tiếp theo.');
    }
  }

  return (
    <div className={styles.profileCard}>
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/png,image/jpeg"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      <form onSubmit={handleSubmit} noValidate>
        {/* Form Title Header */}
        <div className={styles.formHeader}>
          <div className={styles.formHeaderTitle}>
            <span className="material-symbols-outlined">person</span>
            <h2>Thông tin cá nhân</h2>
          </div>
          <span className={styles.badgeUpdate}>Cập nhật thông tin</span>
        </div>

        {/* Avatar Upload Segment */}
        <div className={styles.avatarSegment}>
          <div className={styles.avatarUploadPreviewWrapper}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.fullName}
                className={styles.avatarUploadPreview}
              />
            ) : (
              <div className={styles.avatarUploadPreview}>
                <span>{initial}</span>
              </div>
            )}
          </div>
          <div className={styles.avatarSegmentText}>
            <h3>Ảnh đại diện</h3>
            <p>
              Định dạng hỗ trợ: <strong>JPG, PNG</strong>. Kích thước tối đa <strong>5MB</strong>. Khuyên dùng hình vuông 1024×1024.
            </p>
            <div className={styles.avatarActions}>
              <button
                type="button"
                className={styles.btnUploadPhoto}
                onClick={handleTriggerFileInput}
                disabled={uploadingAvatar || pending}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {uploadingAvatar ? 'hourglass_top' : 'cloud_upload'}
                </span>
                <span>{uploadingAvatar ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}</span>
              </button>
              <button
                type="button"
                className={styles.btnDeletePhoto}
                onClick={handleDeleteAvatar}
                disabled={uploadingAvatar || pending}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span>Xóa ảnh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form Grid */}
        <div className={styles.formGrid}>
          {/* Họ và tên */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabelRow}>
              <label htmlFor="fullName">
                Họ và tên <span className={styles.requiredStar}>*</span>
              </label>
              <span className={styles.fieldSubNote}>Tên in trên vé</span>
            </div>
            <div className={styles.inputControlWrapper}>
              <span className={`material-symbols-outlined ${styles.fieldIcon}`}>badge</span>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className={`${styles.formInput} ${fieldErrors.fullName ? styles.invalid : ''}`}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName) {
                    setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                  }
                }}
                placeholder="Nhập họ và tên..."
                disabled={pending}
                required
                aria-invalid={fieldErrors.fullName ? true : undefined}
              />
            </div>
            {fieldErrors.fullName ? (
              <p className={styles.fieldErrorText}>{fieldErrors.fullName}</p>
            ) : (
              <p className={styles.fieldHelperText}>
                Sử dụng họ tên khớp với CCCD để đối soát tại cổng soát vé.
              </p>
            )}
          </div>

          {/* Email */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabelRow}>
              <label htmlFor="email">
                Email <span className={styles.requiredStar}>*</span>
              </label>
              <span className={styles.fieldSubNote}>Nhận vé điện tử</span>
            </div>
            <div className={styles.inputControlWrapper}>
              <span className={`material-symbols-outlined ${styles.fieldIcon}`}>mail</span>
              <input
                id="email"
                name="email"
                type="email"
                className={`${styles.formInput} ${fieldErrors.email ? styles.invalid : ''}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }
                }}
                placeholder="Nhập địa chỉ email..."
                disabled={pending}
                required
                aria-invalid={fieldErrors.email ? true : undefined}
              />
            </div>
            {fieldErrors.email ? (
              <p className={styles.fieldErrorText}>{fieldErrors.email}</p>
            ) : (
              <p className={styles.fieldHelperText}>
                Email dùng để đăng nhập và nhận thông tin hóa đơn, mã QR vé.
              </p>
            )}
          </div>

          {/* Số điện thoại */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabelRow}>
              <label htmlFor="phone">
                Số điện thoại <span className={styles.requiredStar}>*</span>
              </label>
              <span className={styles.badgeSuccessSmall}>
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                Đã xác thực
              </span>
            </div>
            <div className={styles.inputControlWrapper}>
              <span className={`material-symbols-outlined ${styles.fieldIcon}`}>call</span>
              <input
                id="phone"
                name="phone"
                type="tel"
                className={`${styles.formInput} ${fieldErrors.phone ? styles.invalid : ''}`}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) {
                    setFieldErrors((prev) => ({ ...prev, phone: '' }));
                  }
                }}
                placeholder="Nhập số điện thoại..."
                disabled={pending}
                required
                aria-invalid={fieldErrors.phone ? true : undefined}
              />
            </div>
            {fieldErrors.phone ? (
              <p className={styles.fieldErrorText}>{fieldErrors.phone}</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#006591',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                  }}
                  onClick={() => setOtpModalOpen(true)}
                >
                  <span className="material-symbols-outlined text-[15px]">phonelink_lock</span>
                  Thay đổi số điện thoại (Xác thực OTP)
                </button>
              </div>
            )}
          </div>

          {/* Ngày sinh */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabelRow}>
              <label htmlFor="birthDate">Ngày sinh</label>
              <span className={styles.fieldSubNote}>Định dạng DD/MM/YYYY</span>
            </div>
            <div className={styles.inputControlWrapper}>
              <span className={`material-symbols-outlined ${styles.fieldIcon}`}>calendar_today</span>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                max={TODAY_ISO}
                value={birthDate}
                onChange={(e) => {
                  setBirthDate(e.target.value);
                  if (fieldErrors.birthDate) {
                    setFieldErrors((prev) => ({ ...prev, birthDate: '' }));
                  }
                }}
                className={`${styles.formInput} ${fieldErrors.birthDate ? styles.invalid : ''}`}
                disabled={pending}
                aria-invalid={fieldErrors.birthDate ? true : undefined}
              />
            </div>
            {fieldErrors.birthDate ? (
              <p className={styles.fieldErrorText}>{fieldErrors.birthDate}</p>
            ) : (
              <p className={styles.fieldHelperText}>
                Nhận ưu đãi và quà tặng sinh nhật từ đơn vị tổ chức sự kiện.
              </p>
            )}
          </div>

          {/* Mật khẩu & Bảo mật */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabelRow}>
              <span>Mật khẩu &amp; Bảo mật</span>
              <span className={styles.badgeSuccessSmall}>
                <span className="material-symbols-outlined text-[15px]">verified_user</span>
                Đã thiết lập
              </span>
            </div>
            <div className={styles.securitySettingBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={styles.securityIconBox}>
                  <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                </div>
                <div className={styles.securityTextBox}>
                  <p className={styles.securityTitle}>Đổi mật khẩu tài khoản</p>
                  <p className={styles.securitySub}>Bảo vệ an toàn thông tin cá nhân</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.btnSecurityAction}
                onClick={() => {
                  if (onChangePassword) {
                    onChangePassword();
                  } else {
                    navigate('/customer/change-password');
                  }
                }}
              >
                <span className="material-symbols-outlined text-[16px]">key</span>
                <span>Thay đổi</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
            <p className={styles.fieldHelperText}>
              Cập nhật định kỳ giúp bảo vệ vé điện tử và thanh toán an toàn.
            </p>
          </div>

          {/* Vai trò (Role) - CHỈ ĐỌC */}
          <div className={styles.fieldGroup}>
            <div className={styles.fieldLabelRow}>
              <label htmlFor="userRole">Vai trò tài khoản</label>
              <span className={styles.badgeReadOnly}>
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Chỉ đọc
              </span>
            </div>
            <div className={styles.inputControlWrapper}>
              <span className={`material-symbols-outlined ${styles.fieldIcon}`}>shield</span>
              <input
                id="userRole"
                name="userRole"
                type="text"
                className={`${styles.formInput} ${styles.readonly}`}
                value={roleDisplay}
                disabled
                readOnly
              />
              <span className={`material-symbols-outlined ${styles.inputRightIcon}`}>lock</span>
            </div>
            <p className={styles.fieldHelperText}>
              Vai trò do hệ thống quản lý mặc định cho tài khoản người dùng mua vé.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.formActionsRow}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onCancel}
            disabled={pending}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
            <span>Hủy bỏ</span>
          </button>
          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={pending}
          >
            <span className="material-symbols-outlined text-[20px]">check</span>
            <span>{pending ? 'Đang lưu…' : 'Xác nhận'}</span>
          </button>
        </div>
      </form>

      {/* OTP Simulator Modal */}
      {otpModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setOtpModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined text-[24px]" style={{ color: '#006d3d' }}>sms</span>
                <h3 className={styles.modalTitle}>Xác thực số điện thoại mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setOtpModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6d7b6f' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className={styles.modalBodyText}>
              Mã xác thực gồm 6 chữ số vừa được gửi qua SMS đến số điện thoại mới. Vui lòng nhập mã để hoàn tất.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', margin: '16px 0' }}>
              {otpCode.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const next = [...otpCode];
                    next[idx] = e.target.value;
                    setOtpCode(next);
                  }}
                  style={{
                    width: '44px',
                    height: '48px',
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid #d8dadd',
                    background: '#f2f4f6',
                  }}
                />
              ))}
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnCancel}
                style={{ height: '40px', padding: '0 16px', fontSize: '13px' }}
                onClick={() => setOtpModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={styles.btnSubmit}
                style={{ height: '40px', padding: '0 20px', fontSize: '13px' }}
                onClick={() => {
                  setOtpModalOpen(false);
                  if (onShowNotice) {
                    onShowNotice('Đã xác thực OTP thành công cho số điện thoại mới!');
                  }
                }}
              >
                Xác nhận OTP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

