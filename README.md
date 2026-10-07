# EventHub Frontend — Tài Liệu Kiến Trúc & Hướng Dẫn Phát Triển

Dự án Frontend được xây dựng bằng **React 19 + Vite + TypeScript**, áp dụng kiến trúc **Feature-driven (hướng phân hệ và tính năng)** kết hợp với phân quyền người dùng **RBAC (Role-Based Access Control)** và cơ chế bảo mật xác thực qua **HttpOnly Cookie**.

Tài liệu này được biên soạn chi tiết nhằm phục vụ việc review kiến trúc và hướng dẫn toàn bộ thành viên trong nhóm phát triển tính năng một cách thống nhất, tránh xung đột code.

---

## 1. Kiến Trúc Cốt Lõi (Architecture Overview)

### 1.1. Mô hình phân tầng: Feature ➔ Pages ➔ Components ➔ API Services

Dự án tổ chức mã nguồn theo từng **phân hệ người dùng / tính năng lớn (Vertical Slices)** thay vì gom chung tất cả components hay pages vào một chỗ. Mỗi phân hệ tuân theo luồng kiến trúc 4 tầng:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      PHÂN HỆ NGƯỜI DÙNG (FEATURE)                      │
│             (Ví dụ: features/admin, features/customer, ...)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│         TRANG (PAGES)         │             │    KIỂU DỮ LIỆU (TYPES)       │
│  - Màn hình chính của user    │             │  - Request / Response DTOs    │
│  - Chứa Layout & Outlet       │             │  - Khớp với Entity Backend    │
└───────────────┬───────────────┘             └───────────────┬───────────────┘
                │                                             │
                ▼                                             │
┌───────────────────────────────┐                             │
│     THÀNH PHẦN (COMPONENTS)   │                             │
│  - Các khối UI con tái sử dụng│                             │
│  - Nhận props và render view  │                             │
└───────────────┬───────────────┘                             │
                │                                             │
                ▼                                             │
┌─────────────────────────────────────────────────────────────┴────────┐
│                        DỊCH VỤ GỌI API (API SERVICES)                │
│  - File: `<feature>-api.ts` (nằm trong thư mục `api/`)               │
│  - Sử dụng `httpClient` (Axios instance có sẵn)                      │
│  - Tự động gắn HttpOnly Cookie, header `X-CSRF-Protection: 1`        │
│  - Tự động bắt lỗi 401 và kích hoạt xoay vòng token (Token Rotation) │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │
                                    ▼
                         [ Backend Spring Boot ]
```

* **Feature Module (`src/features/<tên-feature>/`)**: Đại diện cho 1 nhóm đối tượng người dùng (`admin`, `customer`, `organizer`, `staff`) hoặc 1 luồng lớn (`auth`).
* **Pages (`pages/`)**: Các màn hình hoàn chỉnh mà router trỏ tới (ví dụ: `AdminPage.tsx`, `CustomerPage.tsx`).
* **Components (`components/`)**: Các thành phần giao diện nhỏ hơn cấu thành nên Page (ví dụ: `EventCard.tsx`, `UserTable.tsx`, `FilterBar.tsx`).
* **API Service (`api/`)**: Chuyên trách việc gọi HTTP request đến server (dùng `httpClient.get`, `httpClient.post`). **Khuyến nghị:** Đặt tên thư mục là `api/` (thay vì `services/`) để ngắn gọn và đồng bộ với các file sẵn có như `auth-api.ts`.
* **Types (`types/`)**: Định nghĩa interface TypeScript để đảm bảo tính an toàn dữ liệu (Type-safe).

---

## 2. Cơ Chế Xác Thực & Phân Quyền (Auth & RBAC Flow)

### 2.1. Quản lý phiên bằng HttpOnly Cookie (Tại sao KHÔNG dùng localStorage?)
1. **Lưu Token:** Sau khi đăng nhập thành công (`POST /api/auth/login`), Backend tự động thiết lập 2 cookie:
   * `access_token` (Path: `/api`, sống 15 phút).
   * `refresh_token` (Path: `/api/auth`, sống 7 ngày).
2. **Bảo mật tuyệt đối:** Cả 2 cookie đều có cờ `HttpOnly`, JavaScript ở Frontend **không thể đọc được** -> Ngăn chặn 100% rủi ro bị đánh cắp token qua lỗ hổng XSS.
3. **Tuyệt đối KHÔNG lưu token vào `localStorage` hay `sessionStorage`**. Trình duyệt sẽ tự động gửi kèm cookie trong mọi request nhờ `withCredentials: true` cấu hình sẵn trong `httpClient`.

### 2.2. Nơi lưu thông tin User ở Frontend & Cơ chế Silent Refresh khi F5
* **Vị trí lưu:** Thông tin người dùng (`id`, `email`, `fullName`, `role`) được lưu trong **React State** thông qua `AuthContext` tại [`src/app/AuthProvider.tsx`](src/app/AuthProvider.tsx).
* **Khi người dùng F5 hoặc mở lại trình duyệt:**
  1. React State bị reset về `null`, nhưng biến `loading = true`.
  2. `useEffect` trong `AuthProvider` tự động gọi ngay: `POST /api/auth/refresh`.
  3. Trình duyệt tự gửi cookie `refresh_token` lên Backend.
  4. Backend xác thực hợp lệ và trả về thông tin user mới nhất -> Frontend gọi `setUser(currentUser)` và chuyển `loading = false`.
  5. Người dùng tiếp tục sử dụng ứng dụng mà **không bao giờ bị văng ra màn hình đăng nhập**.

### 2.3. Logic kiểm tra quyền và định tuyến trong `AppRouter.tsx`
Trong [`src/app/AppRouter.tsx`](src/app/AppRouter.tsx), Router sử dụng hook `useAuth()` để lấy dữ liệu từ `AuthProvider` và bảo vệ các tuyến đường bằng các Route Guard:

* **`GuestRoute`**: Nếu đã đăng nhập (`user != null`), không cho phép vào `/login` hay `/register` (tự động điều hướng về `/`).
* **`ProtectedRoute`**: Yêu cầu người dùng phải đăng nhập (`user != null`), nếu chưa sẽ chuyển hướng về `/login`.
* **`AdminRoute`**: Kiểm tra `user?.role === 'ADMIN'`. Nếu không phải Admin, tự động chuyển về trang chủ `/`.
* **`OrganizerRoute`**: Kiểm tra `user?.role === 'ORGANIZER'`.
* **`StaffRoute`**: Kiểm tra `user?.role === 'STAFF'`.
* **`LandingPage`**: Khi truy cập trang chủ `/`, hệ thống dựa trên `user.role` để chuyển hướng người dùng về đúng trang mặc định của vai trò đó:
  * Role `ADMIN` ➔ Chuyển hướng sang `/admin`.
  * Role `ORGANIZER` ➔ Chuyển hướng sang `/organizer`.
  * Role `STAFF` ➔ Chuyển hướng sang `/staff`.
  * Role `CUSTOMER` / Khách ➔ Ở lại trang chủ khách hàng `/customer`.

---

## 3. Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
src/
├── app/
│   ├── AppRouter.tsx          # Định tuyến trung tâm & phân quyền Route Guards
│   └── AuthProvider.tsx       # Quản lý React Context lưu trữ User state & Silent Refresh
├── components/
│   ├── common/                # Các component dùng chung toàn bộ dự án (Header, Footer chung)
│   └── ui/                    # Các phần tử giao diện cơ bản (Button, Input, Modal, Dialog...)
├── features/                  # CÁC PHÂN HỆ NGƯỜI DÙNG & CHỨC NĂNG CHÍNH
│   ├── admin/                 # Phân hệ Quản trị viên (Role: ADMIN)
│   │   ├── api/admin-api.ts   # Service gọi API quản trị
│   │   ├── pages/AdminPage.tsx# Trang giao diện mặc định của Admin (/admin)
│   │   └── types/admin.ts     # Kiểu dữ liệu cho Admin
│   ├── customer/              # Phân hệ Khách hàng (Role: CUSTOMER)
│   │   ├── api/customer-api.ts# Service gọi API sự kiện, đặt vé, lịch sử vé
│   │   ├── pages/CustomerPage.tsx # Trang giao diện của Khách hàng (/customer)
│   │   └── types/customer.ts  # Kiểu dữ liệu sự kiện, vé
│   ├── organizer/             # Phân hệ Ban tổ chức (Role: ORGANIZER)
│   │   ├── pages/OrganizerPage.tsx # Trang giao diện của Ban tổ chức (/organizer)
│   │   └── (tích hợp tính năng tạo sự kiện từ nhánh feature/create-event)
│   ├── staff/                 # Phân hệ Nhân viên soát vé (Role: STAFF)
│   │   ├── api/staff-api.ts   # Service gọi API check-in, soát vé
│   │   ├── pages/StaffPage.tsx# Trang giao diện soát vé (/staff)
│   │   └── types/staff.ts     # Kiểu dữ liệu soát vé
│   └── auth/                  # Phân hệ Xác thực
│       ├── api/auth-api.ts    # Service gọi API đăng ký, đăng nhập, refresh, logout
│       ├── api/auth-errors.ts # Xử lý và chuẩn hóa thông báo lỗi tiếng Việt
│       ├── hooks/useAuth.ts   # Custom hook useAuth() dùng để lấy thông tin user ở mọi nơi
│       ├── pages/LoginPage.tsx
│       ├── pages/RegisterPage.tsx
│       └── types/auth.ts      # User, LoginRequest, RegisterRequest
├── lib/
│   └── http-client.ts         # Axios instance: tự động gắn CSRF header, bắt 401 & tự xoay vòng token
├── pages/
│   └── HomePage.tsx           # Trang điều hướng mặc định sau đăng nhập
├── styles/                    # Global CSS, css variables
├── App.tsx
└── main.tsx
```

---

## 4. Bảng Tra Cứu Đường Dẫn (Route Map)

| Đường dẫn (URL) | Route Guard | Quyền truy cập (Role) | Mô tả giao diện |
| :--- | :--- | :--- | :--- |
| `/login` | `GuestRoute` | Khách vãng lai (Chưa đăng nhập) | Trang đăng nhập tài khoản |
| `/register` | `GuestRoute` | Khách vãng lai (Chưa đăng nhập) | Trang đăng ký tài khoản (Customer / Organizer) |
| `/` | `ProtectedRoute` | Đã đăng nhập | Tự động chuyển hướng đến trang tương ứng theo Role |
| `/customer` | `ProtectedRoute` | `CUSTOMER` | Giao diện xem và đặt vé của Khách hàng |
| `/admin` | `AdminRoute` | `ADMIN` | Giao diện quản trị hệ thống |
| `/organizer` | `OrganizerRoute` | `ORGANIZER` | Giao diện kênh Ban tổ chức sự kiện |
| `/staff` | `StaffRoute` | `STAFF` | Giao diện quét mã soát vé cho nhân viên |

---

## 5. Hướng Dẫn Quy Chuẩn Code Cho Thành Viên Nhóm (Coding Guide)

Khi một thành viên nhận nhiệm vụ phát triển một tính năng mới trong phân hệ của mình, hãy tuân theo quy trình chuẩn 5 bước sau:

### Bước 1: Khai báo kiểu dữ liệu trong `types/<feature>.ts`
Luôn định nghĩa interface rõ ràng trước khi viết code:
```ts
// src/features/admin/types/admin.ts
export interface UserManagementItem {
  id: number
  email: string
  fullName: string
  role: 'CUSTOMER' | 'ORGANIZER' | 'STAFF' | 'ADMIN'
  status: 'ACTIVE' | 'BANNED'
}
```

### Bước 2: Viết hàm gọi API trong `api/<feature>-api.ts`
Sử dụng trực tiếp `httpClient` từ `src/lib/http-client`:
```ts
// src/features/admin/api/admin-api.ts
import { httpClient } from '../../../lib/http-client'
import type { UserManagementItem } from '../types/admin'

export async function getUsers(): Promise<UserManagementItem[]> {
  const response = await httpClient.get<UserManagementItem[]>('/admin/users')
  return response.data
}
```
*(Không cần tự gắn header Authorization hay lo lắng về cookie, `httpClient` đã tự động xử lý toàn bộ).*

### Bước 3: Tạo Component con trong `components/` (nếu cần tái sử dụng)
Sử dụng CSS Modules đi kèm để tránh xung đột CSS toàn cục:
* File giao diện: `UserTable.tsx`
* File CSS: `UserTable.module.css`

### Bước 4: Tạo hoặc hoàn thiện Trang trong `pages/`
Gọi hàm API trong `useEffect` và truyền dữ liệu xuống component con để hiển thị:
```tsx
// src/features/admin/pages/UserManagementPage.tsx
import { useEffect, useState } from 'react'
import { getUsers } from '../api/admin-api'
import type { UserManagementItem } from '../types/admin'

export function UserManagementPage() {
  const [users, setUsers] = useState<UserManagementItem[]>([])

  useEffect(() => {
    getUsers().then(setUsers)
  }, [])

  return (
    <div>
      <h2>Quản lý người dùng</h2>
      {/* Render danh sách user */}
    </div>
  )
}
```

### Bước 5: Đăng ký Route vào `src/app/AppRouter.tsx`
Thêm route mới vào đúng nhóm quyền được bảo vệ tương ứng.

---

## 6. Lệnh Khởi Chạy & Kiểm Thử

```bash
# 1. Cài đặt thư viện
npm install

# 2. Khởi chạy môi trường phát triển (Dev server)
npm run dev

# 3. Kiểm tra lỗi cú pháp và chuẩn mã nguồn (Linter)
npm run lint

# 4. Kiểm tra biên dịch TypeScript & Đóng gói sản phẩm (Build)
npm run build

# 5. Chạy bộ kiểm thử tự động E2E (Playwright)
# Nếu dùng Google Chrome có sẵn trên máy:
$env:PLAYWRIGHT_CHANNEL='chrome'; npm run test:e2e
```
