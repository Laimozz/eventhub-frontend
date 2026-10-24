# EventHub Frontend — Tài Liệu Kiến Trúc & Hướng Dẫn Phát Triển

Dự án Frontend được xây dựng bằng **React 19 + Vite + TypeScript**, áp dụng kiến trúc **Feature-driven (hướng phân hệ và tính năng)** kết hợp với phân quyền người dùng **RBAC (Role-Based Access Control)** và cơ chế bảo mật xác thực qua **HttpOnly Cookie**. Đã triển khai đăng ký, đăng nhập; thông tin cá nhân và đổi mật khẩu; Organizer tạo sự kiện theo ba bước, xem danh sách/chi tiết, sửa và hủy trước giờ bắt đầu, kết nối API của `eventhub-backend`.

## Khám phá và trạng thái bán vé

- `/customer/explore` có 12 sự kiện mỗi trang. `page` bắt đầu từ 0 trên URL, giữ các bộ lọc khi chuyển trang và hỗ trợ Back/Forward; áp dụng/xóa bộ lọc hoặc tìm kiếm mới sẽ về trang đầu.
- Thẻ và chi tiết sự kiện dùng `status` cùng `salesStatus` từ API. Phân biệt sự kiện sắp diễn ra/đang diễn ra/đã kết thúc với vé chưa mở bán/đang mở bán/hết vé/đã đóng bán/tạm ngừng bán. Danh sách loại vé, giá và số còn lại lấy từ dữ liệu thật; chỉ mở nút đặt vé khi được bán.
- Thời gian public hiển thị theo GMT+7. Logo EventHub dẫn về trang chính theo role đang đăng nhập: Organizer `/organizer`, Admin `/admin` (chuyển tới `/admin/events/pending`), Staff `/staff`, Customer và khách chưa đăng nhập `/customer`; áp dụng cả khi đang xem trang Customer bằng role khác.
- Hủy sự kiện dừng bán/phát hành, vô hiệu vé chưa dùng và giải phóng booking đang giữ; thao tác hủy chưa tạo hồ sơ hoàn tiền.
- Kiểm thử các luồng này: `$env:PLAYWRIGHT_CHANNEL='msedge'; npm.cmd run test:e2e -- tests/public-events.spec.ts`.

## Tài chính Admin UC37–UC42

- `/admin/statistics`: số liệu từ API, số dư ví Organizer và doanh thu gộp/ròng. Doanh thu chưa được backend xác định hiển thị “Chưa xác định”, không đổi null thành 0.
- `/admin/withdrawals`, `/admin/withdrawals/:requestId`: lọc/phân trang, xem chi tiết, ghi nhận chuyển khoản đã thực hiện ngoài hệ thống và từ chối có lý do. Khi lỗi quyết định, tải lại dữ liệu; chặn gửi khi chưa tải xong, yêu cầu đã xử lý hoặc đã có payout cần đối soát.
- `/admin/refunds`, `/admin/refunds/:eventId`: danh sách sự kiện CANCELED, hoàn hàng loạt; dashboard hỗ trợ hoàn cá nhân, truy vấn kết quả và hoàn thủ công với tài khoản/chứng từ chỉ Admin được xem.
- API dùng client cookie/CSRF hiện có. Kiểm thử giả lập ở `tests/admin-finance.spec.ts`; chạy `npm.cmd run test:e2e -- tests/admin-finance.spec.ts`. Đã nối UC11/UC25; nghiệm thu VNPAY sandbox cần quyền merchant và cấu hình thực tế; xem `../plan.md`.

## Quản trị UC31–36

Admin đăng nhập được chuyển tới /admin/events/pending. Feature `src/features/admin` dùng router/AuthProvider và Axios client chung; CSS Modules, Lucide, bố cục theo mẫu platform.

| Route                          | Chức năng                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| /admin/users                   | Tìm tên/email, lọc role, phân trang, tạo CUSTOMER/ORGANIZER, khóa/mở; chặn tự khóa        |
| /admin/event-categories        | Thêm/sửa/xóa danh mục; xử lý trùng tên và danh mục đang dùng                              |
| /admin/events/pending          | Danh sách chỉ sự kiện chờ duyệt                                                           |
| /admin/events/pending/:eventId | Hồ sơ, ảnh, địa điểm, khách mời, vé; duyệt có xác nhận, từ chối có lý do tối đa 255 ký tự |
| /admin/notifications, /organizer/notifications, /customer/thong-bao | Thông báo của tài khoản đăng nhập, phân trang, đánh dấu đọc và cập nhật realtime qua SSE |

UI có loading/lỗi/thử lại/rỗng, dialog giữ dữ liệu khi lỗi, chặn gửi lặp. Quyết định gửi version nhận từ chi tiết; 404/409 chặn quyết định tiếp đến khi đọc lại hồ sơ. Trang Organizer bổ sung trạng thái REJECTED và rejectReason; chưa mở sửa/gửi lại REJECTED.

Chuông thông báo nằm trên top bar cạnh avatar ở cổng Admin, Organizer và Customer, kèm số chưa đọc. `NotificationsProvider` duy trì một kết nối SSE cho mỗi tab đăng nhập thuộc ba vai trò này; REST dùng Axios client chung, SSE gửi cookie với `withCredentials`. Sau sự kiện SSE hoặc reconnect, frontend tải lại danh sách/số chưa đọc từ backend. Kết nối đóng khi đăng xuất/đổi tài khoản. Staff tạm thời không có giao diện, request API hoặc kết nối SSE thông báo. Kiểm thử UI ở `tests/notifications.spec.ts` giả lập API/SSE; backend có kiểm thử PostgreSQL và SSE riêng.

ApiError giữ thêm code/message/errors từ backend để hiện lỗi nghiệp vụ; cơ chế cookie/refresh vẫn giữ nguyên. Test `tests/admin.spec.ts` chạy desktop/mobile với API giả lập; backend kiểm thử API và DB thật riêng. Trên máy có Edge có thể dùng `$env:PLAYWRIGHT_CHANNEL='msedge'; npm.cmd run test:e2e`. PowerShell chặn npm.ps1 thì dùng npm.cmd.

Đã triển khai đầy đủ luồng xác thực (Đăng ký, Đăng nhập, Token Rotation), thông tin cá nhân & đổi mật khẩu của Khách hàng (`features/customer`), giao diện Ban tổ chức tạo sự kiện (`features/events` & `features/organizer`) và khung phân quyền cho cả 4 nhóm người dùng (`ADMIN`, `ORGANIZER`, `CUSTOMER`, `STAFF`).

---

## 1. Khởi Chạy Dự Án

Yêu cầu môi trường: **Node.js 20+**, **npm**.

```bash
npm install
npm run dev
```

- Mở trình duyệt tại: `http://localhost:5173`.
- Backend chạy tại: `http://localhost:8080` (tham khảo README của `eventhub-backend` để cấu hình PostgreSQL và JWT).
- Vite đã cấu hình proxy tự động chuyển tiếp các request `/api` sang `http://localhost:8080`.

---

## 2. Kiến Trúc Cốt Lõi (Architecture Overview)

### 2.1. Danh mục đường dẫn chính

| Đường dẫn | Hành vi |
| --- | --- |
| `/register` | Đăng ký CUSTOMER hoặc ORGANIZER; thành công chuyển sang đăng nhập, chưa tạo phiên. |
| `/login` | Chỉ nhập email, mật khẩu và đăng nhập; không có đăng nhập mạng xã hội hoặc mô phỏng kiểm thử. |
| `/` | Yêu cầu đăng nhập; Organizer được chuyển tới `/organizer`; các role còn lại có trang đăng xuất. |
| `/customer` | Cổng thông tin khách hàng, xem chi tiết và cập nhật thông tin cá nhân, đổi mật khẩu. |
| `/organizer` | Chỉ ORGANIZER; trang tổng quan kết nối dữ liệu thật (Hero sự kiện nổi bật, KPI bán vé, phân tích doanh thu, số dư ví). |
| `/organizer/events/new/details` | Bước 1: thông tin, địa điểm, thời gian, ảnh bìa/thumbnail/sơ đồ. |
| `/organizer/events/new/category` | Bước 2: danh mục từ DB và khách mời (tùy chọn). |
| `/organizer/events/new/tickets` | Bước 3: thêm/sửa/xóa/nhân bản loại vé, kiểm tra hồ sơ và gửi duyệt. |
| `/organizer/events` | Danh sách từ API: tìm theo tên, lọc trạng thái và phân trang. |
| `/organizer/events/:eventId` | Chi tiết, địa điểm, ảnh, khách mời, số vé phát hành/đã bán/giữ chỗ/còn lại; sửa hoặc hủy trước giờ bắt đầu khi được phép; tab Quản lý nhân viên soát vé (UC 21 & UC 22). |
| `/organizer/events/:eventId/edit/:step` | Dùng lại form tạo với `details`, `category`, `tickets`; tải hồ sơ hiện tại, sửa và gửi duyệt lại. |
| `/organizer/staffs` | Phân công & điều phối nhân viên soát vé cho các sự kiện (UC 21 & UC 22). |
| `/organizer/wallet` | Doanh thu & quản lý số dư ví, tạo yêu cầu rút tiền, xem lịch sử và hủy yêu cầu (UC 24, 25, 26, 27). |
| `/staff` | Cổng Nhân viên soát vé (**UC28**); xem danh sách sự kiện được phân công, lọc theo ngày và trạng thái ca trực. |
| `/staff/events/:eventId` | Chi tiết sự kiện phân công (**UC29**), thống kê vé (Tổng vé, Đã soát vé, Chưa check-in), thanh lọc 2 cấp (Khách hàng, Loại vé, Trạng thái) và danh sách vé phân trang (chế độ tra cứu chỉ đọc trên Web). |
| `/staff/profile` | Thông tin cá nhân và đổi mật khẩu của tài khoản nhân viên. |

### 2.2. Mô hình phân tầng: Feature ➔ Pages ➔ Components ➔ API Services

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

- **Feature Module (`src/features/<tên-feature>/`)**: Đại diện cho 1 nhóm đối tượng người dùng (`admin`, `customer`, `organizer`, `staff`) hoặc 1 luồng lớn (`auth`, `events`).
- **Pages (`pages/`)**: Các màn hình hoàn chỉnh mà router trỏ tới (ví dụ: `AdminPage.tsx`, `CreateEventPage.tsx`).
- **Components (`components/`)**: Các thành phần giao diện nhỏ hơn cấu thành nên Page (ví dụ: `EventEditors.tsx`, `EventFields.tsx`).
- **API Service (`api/`)**: Chuyên trách việc gọi HTTP request đến server (dùng `httpClient.get`, `httpClient.post`). **Quy chuẩn chung:** Đặt tên thư mục là `api/` (thay vì `services/`) để ngắn gọn và đồng bộ (`auth-api.ts`, `event-api.ts`).
- **Types (`types/`)**: Định nghĩa interface TypeScript để đảm bảo tính an toàn dữ liệu (Type-safe).

---

### Xem, sửa và hủy sự kiện

- Sidebar “Sự kiện của tôi” mở danh sách riêng qua `GET /api/events/mine`. Bộ lọc, tên tìm kiếm và trang nằm trong URL để tải lại hoặc Back/Forward; có trạng thái đang tải, lỗi/thử lại và danh sách rỗng. Các thẻ tổng số/trạng thái dùng dữ liệu API. Bố cục nền sáng, thẻ trắng, điểm nhấn xanh theo mẫu; chỉ hiển thị các phần có dữ liệu backend.
- Chi tiết lấy `GET /api/events/:id`, hiển thị hồ sơ và loại vé/khách mời thật. Số vé đã bán loại trừ số giữ chỗ. API chỉ trả sự kiện thuộc tài khoản; FE không nhận Organizer ID từ URL để thay đổi quyền sở hữu.
- Sửa dùng cùng `CreateEventPage` và các hộp chỉnh sửa hiện có. Thời gian UTC được đổi về GMT+7, giữ ID loại vé/khách mời, hiện ảnh đã lưu. Thay ảnh thì chỉ gửi file mới; không thay thì giữ URL ở backend. Có thể xóa sơ đồ và ảnh khách mời, thêm/sửa/xóa khách mời và loại vé; vé đã bán/giữ chỗ không cho xóa hoặc giảm số lượng dưới mức đã phân bổ. Backend kiểm tra cả liên kết booking cũ.
- `PUT /api/events/:id` gửi hồ sơ multipart và các file theo thứ tự mảng đã chỉnh sửa. Ảnh bắt buộc của loại vé mới phải được chọn; khi nhân bản vé cũ cần chọn ảnh cho vé mới. Sửa chỉ được phép trước giờ bắt đầu với trạng thái Chờ duyệt/Đã duyệt. Thành công trở về chi tiết, trạng thái Chờ duyệt và vé tạm ngừng bán để Admin xét lại. Không lưu bản chỉnh sửa vào bản nháp tạo sự kiện trong sessionStorage.
- Hủy mở hộp nhập lý do (bắt buộc, tối đa 255 ký tự), gọi `POST /api/events/:id/cancel`. Chỉ hủy trước giờ bắt đầu; thành công hiển thị Đã hủy và lý do. Backend ngừng bán, vô hiệu vé và tạo hồ sơ chờ hoàn; Admin nhấn hoàn hàng loạt hoặc xử lý cá nhân trên dashboard.
- Các request dùng client cookie/CSRF/refresh hiện có. Chặn gửi lặp, giữ form khi API lỗi. Tạo/sửa multipart có timeout 180 giây để chờ upload ảnh; các API đọc vẫn dùng timeout mặc định.

- Đăng ký kiểm tra họ tên, email, mật khẩu 8–72 ký tự/tối đa 72 byte UTF-8 và xác nhận mật khẩu. Số điện thoại không bắt buộc theo DTO backend, tối đa 20 ký tự. Không trim mật khẩu.
- API gọi `POST /api/auth/register`, `/login`, `/refresh`, `/logout`, luôn có `X-CSRF-Protection: 1` và `withCredentials: true`.
- Token do backend đặt trong cookie HttpOnly. Không lưu token hoặc mật khẩu vào localStorage/sessionStorage.
- Khi tải lại ứng dụng, gọi refresh để khôi phục phiên vì backend chưa có endpoint `/me`.
- Axios interceptor bắt `401` của API cần xác thực, gọi `POST /api/auth/refresh`, rồi gửi lại request ban đầu một lần với cookie mới. Nhiều request cùng hết hạn dùng chung một lần refresh; response `401` đến muộn từ token cũ cũng dùng phiên đã được làm mới.
- Refresh trả `401` (hết hạn, bị thu hồi hoặc thiếu refresh token), hoặc request thử lại vẫn trả `401`: xóa trạng thái user và chuyển về `/login`. Backend chịu trách nhiệm xóa cookie HttpOnly khi refresh không hợp lệ.
- Không tự refresh cho login/register/refresh/logout; không xử lý `403` như token hết hạn. Lỗi mạng hoặc `5xx` khi refresh được trả về cho nơi gọi xử lý, không tự đăng xuất.
- Logout chờ refresh đang chạy hoàn tất để thu hồi đúng phiên mới. Request cũ không được tự thử lại sau khi người dùng đã đăng xuất hoặc đăng nhập tài khoản khác.
- Mọi API cần cơ chế này phải dùng `httpClient` từ `src/lib/http-client.ts`, ví dụ `httpClient.get('/events')` hoặc `post('/bookings', body)`. Token vẫn nằm trong cookie HttpOnly; frontend không đọc hay giải mã token.
- Đăng xuất chỉ chuyển trang khi backend trả thành công. Khi mất kết nối, giữ trang hiện tại và cho phép thử lại.
- Form có trạng thái đang gửi, chặn gửi lặp, thông báo lỗi bằng tiếng Việt và nút hiện/ẩn mật khẩu.
- Chưa triển khai quên mật khẩu, OAuth, ghi nhớ đăng nhập tùy chọn hay các trang nghiệp vụ khác vì backend chưa có API tương ứng.

## 3. Cơ Chế Xác Thực & Phân Quyền (Auth & RBAC Flow)

### 3.1. Quản lý phiên bằng HttpOnly Cookie (Tại sao KHÔNG dùng localStorage?)

1. **Lưu Token:** Sau khi đăng nhập thành công (`POST /api/auth/login`), Backend tự động thiết lập 2 cookie:
   - `access_token` (Path: `/api`, sống 15 phút).
   - `refresh_token` (Path: `/api/auth`, sống 7 ngày).
2. **Hạn chế lộ token:** Cả 2 cookie có cờ `HttpOnly` nên JavaScript không đọc trực tiếp được token. XSS vẫn có thể gửi request trong phiên người dùng; cần tiếp tục kiểm soát dữ liệu đầu vào và nội dung hiển thị.
3. **Tuyệt đối KHÔNG lưu token vào `localStorage` hay `sessionStorage`**. Trình duyệt tự động gửi kèm cookie trong mọi request nhờ `withCredentials: true` cấu hình sẵn trong `httpClient`.

### 3.2. Nơi lưu thông tin User ở Frontend & Cơ chế Silent Refresh khi F5

- **Vị trí lưu:** Thông tin người dùng (`id`, `email`, `fullName`, `role`) được lưu trong **React State** thông qua `AuthContext` tại [`src/app/AuthProvider.tsx`](src/app/AuthProvider.tsx).
- **Khi người dùng F5 hoặc mở lại trình duyệt:**
  1. React State bị reset về `null`, nhưng biến `loading = true`.
  2. `useEffect` trong `AuthProvider` tự động gọi ngay: `POST /api/auth/refresh`.
  3. Trình duyệt tự gửi cookie `refresh_token` lên Backend.
  4. Backend xác thực hợp lệ và trả về thông tin user mới nhất -> Frontend gọi `setUser(currentUser)` và chuyển `loading = false`.
  5. Người dùng tiếp tục sử dụng ứng dụng mà **không bị văng ra màn hình đăng nhập**.

### 3.3. Logic kiểm tra quyền và định tuyến trong `AppRouter.tsx`

Trong [`src/app/AppRouter.tsx`](src/app/AppRouter.tsx), Router sử dụng hook `useAuth()` để lấy dữ liệu từ `AuthProvider` và bảo vệ các tuyến đường bằng các Route Guard:

- **`GuestRoute`**: Nếu đã đăng nhập (`user != null`), không cho phép vào `/login` hay `/register` (tự động điều hướng về `/`).
- **`ProtectedRoute`**: Yêu cầu người dùng phải đăng nhập (`user != null`), nếu chưa sẽ chuyển hướng về `/login`.
- **`AdminRoute`**: Kiểm tra `user?.role === 'ADMIN'`. Nếu không phải Admin, tự động chuyển về trang chủ `/`.
- **`OrganizerRoute`**: Kiểm tra `user?.role === 'ORGANIZER'`.
- **`StaffRoute`**: Kiểm tra `user?.role === 'STAFF'`.
- **`LandingPage`**: Khi truy cập trang chủ `/`, hệ thống dựa trên `user.role` để chuyển hướng người dùng về đúng trang mặc định của vai trò đó:
  - Role `ADMIN` ➔ Chuyển hướng sang `/admin`.
  - Role `ORGANIZER` ➔ Chuyển hướng sang `/organizer`.
  - Role `STAFF` ➔ Chuyển hướng sang `/staff`.
  - Role `CUSTOMER` / Khách ➔ Trang mặc định của khách `/customer`.

---

## 4. Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
src/
├── app/
│   ├── AppRouter.tsx          # Định tuyến trung tâm & phân quyền Route Guards
│   └── AuthProvider.tsx       # Quản lý React Context lưu trữ User state & Silent Refresh
├── components/
│   ├── common/                # Các component dùng chung toàn bộ dự án
│   └── ui/                    # Các phần tử giao diện cơ bản (Button, Input...)
├── features/                  # CÁC PHÂN HỆ NGƯỜI DÙNG & TÍNH NĂNG CHÍNH
│   ├── admin/                 # Phân hệ Quản trị viên (Role: ADMIN)
│   │   ├── api/admin-api.ts   # Service gọi API quản trị
│   │   ├── pages/AdminPage.tsx# Trang giao diện mặc định của Admin (/admin)
│   │   └── types/admin.ts     # Kiểu dữ liệu cho Admin
│   ├── customer/              # Phân hệ Khách hàng (Role: CUSTOMER)
│   │   ├── api/customer-api.ts# Service gọi API sự kiện, đặt vé, lịch sử vé
│   │   ├── pages/CustomerPage.tsx # Trang giao diện của Khách hàng (/customer)
│   │   └── types/customer.ts  # Kiểu dữ liệu sự kiện, vé
│   ├── organizer/             # Phân hệ Ban tổ chức (Role: ORGANIZER)
│   │   ├── pages/OrganizerLayout.tsx    # Layout Sidebar Ban tổ chức
│   │   └── pages/OrganizerDashboard.tsx # Bảng điều khiển Ban tổ chức (/organizer)
│   ├── events/                # Tính năng Tạo sự kiện (cho Organizer)
│   │   ├── api/event-api.ts   # API tạo sự kiện qua multipart
│   │   ├── components/        # EventEditors.tsx, EventFields.tsx
│   │   ├── pages/CreateEventPage.tsx # Form tạo sự kiện 3 bước (/organizer/events/new)
│   │   └── types/event.ts     # Kiểu dữ liệu sự kiện
│   ├── staff/                 # Phân hệ Nhân viên soát vé (Role: STAFF)
│   │   ├── api/staff-api.ts   # Service gọi API check-in, soát vé
│   │   ├── pages/StaffPage.tsx# Trang giao diện soát vé (/staff)
│   │   └── types/staff.ts     # Kiểu dữ liệu soát vé
│   └── auth/                  # Phân hệ Xác thực
│       ├── api/auth-api.ts    # Service gọi API đăng ký, đăng nhập, refresh, logout
│       ├── api/auth-errors.ts # Xử lý và chuẩn hóa thông báo lỗi tiếng Việt
│       ├── hooks/useAuth.ts   # Custom hook useAuth()
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

## 5. Bảng Tra Cứu Đường Dẫn (Route Map)

| Đường dẫn (URL)         | Route Guard      | Quyền truy cập (Role) | Mô tả giao diện                                    |
| :---------------------- | :--------------- | :-------------------- | :------------------------------------------------- |
| `/login`                | `GuestRoute`     | Khách vãng lai        | Trang đăng nhập tài khoản                          |
| `/register`             | `GuestRoute`     | Khách vãng lai        | Trang đăng ký tài khoản (Customer / Organizer)     |
| `/`                     | `ProtectedRoute` | Đã đăng nhập          | Tự động chuyển hướng đến trang tương ứng theo Role |
| `/customer`             | `ProtectedRoute` | `CUSTOMER`            | Giao diện xem và đặt vé của Khách hàng             |
| `/admin`                | `AdminRoute`     | `ADMIN`               | Giao diện quản trị hệ thống                        |
| `/organizer`            | `OrganizerRoute` | `ORGANIZER`           | Bảng điều khiển Ban tổ chức sự kiện                |
| `/organizer/events/new` | `OrganizerRoute` | `ORGANIZER`           | Tạo sự kiện mới (3 bước: chi tiết, danh mục, vé)   |
| `/staff`                | `StaffRoute`     | `STAFF`               | Giao diện quét mã soát vé cho nhân viên            |

---

## 6. Hướng Dẫn Quy Chuẩn Code Cho Thành Viên Nhóm (Coding Guide)

Khi một thành viên nhận nhiệm vụ phát triển một tính năng mới trong phân hệ của mình, hãy tuân theo quy trình chuẩn 5 bước sau:

1. **Bước 1: Khai báo kiểu dữ liệu trong `types/<feature>.ts`**: Định nghĩa rõ request/response interface.
2. **Bước 2: Viết hàm gọi API trong `api/<feature>-api.ts`**: Dùng trực tiếp `httpClient` từ `src/lib/http-client` (đã có cookie, CSRF và refresh tự động).
3. **Bước 3: Tạo Component con trong `components/`**: Dùng CSS Modules đi kèm để tránh xung đột class name.
4. **Bước 4: Tạo hoặc hoàn thiện Trang trong `pages/`**: Gọi hàm API và render dữ liệu.
5. **Bước 5: Đăng ký Route vào `src/app/AppRouter.tsx`**: Đặt vào đúng nhóm quyền bảo vệ.

---

## 7. Kiểm Tra & Đóng Gói

### Đặt vé, thanh toán và QR

| Đường dẫn | Chức năng |
| --- | --- |
| `/customer/events/:eventId/book` | Chọn loại vé và số lượng theo kho từ backend |
| `/customer/bookings/:bookingId/checkout` | Thông tin tài khoản, hạn giữ vé, chuyển sang VNPay Sandbox |
| `/customer/payment-result` | Xác thực callback với backend và chờ IPN; chỉ thông báo thành công khi booking PAID |
| `/customer/booking-cua-toi` | Lịch sử booking phân trang |
| `/customer/bookings/:bookingId` | Chi tiết vé đã chọn, tổng tiền và các lần thanh toán |
| `/customer/ve-cua-toi` | Vé điện tử/QR, lọc vé chưa dùng/đã check-in |
| `/customer/bookings/:bookingId/tickets` | Vé theo booking, phóng to QR |

Các trang booking/vé yêu cầu CUSTOMER và sẽ quay lại trang đang mở sau khi đăng nhập. Trang payment-result công khai để nhận redirect, nhưng chi tiết booking/vé vẫn yêu cầu chủ tài khoản. Giá, kho, trạng thái thanh toán và hiệu lực QR do backend quyết định. Vé miễn phí được phát hành ngay theo response PAID.

Khi đã bắt đầu thanh toán và vừa hết hạn, backend có thể trả PAYMENT_CONFIRMING với paymentConfirmationDeadline (mặc định giữ thêm 120 giây để chờ IPN). FE hiển thị “Đang xác nhận thanh toán”, khóa thanh toán lại và đếm ngược theo deadline của backend. Trang kết quả kiểm tra mỗi 2 giây cho đến trạng thái kết thúc, không dừng sau 60 giây; checkout/chi tiết cập nhật mỗi 5 giây khi còn PENDING/PAYMENT_CONFIRMING. Hạn thanh toán ban đầu vẫn là expiredAt. Khi backend trả EXPIRED, trang kết quả cho phép kiểm tra lại để đọc trạng thái của IPN đến muộn.

Backend cần `VNPAY_RETURN_URL=http://localhost:5173/customer/payment-result` khi chạy FE mặc định, cùng merchant/secret Sandbox. IPN đăng ký phía VNPay là `https://<backend-public>/api/payments/vnpay/ipn`, phải truy cập được từ Internet. Khi deploy thay Return URL bằng domain FE; không đưa hash secret vào frontend.

Ảnh QR mã hóa token riêng cho từng vé bằng `qrcode.react`. Trang vé cập nhật mỗi 10 giây và khi tab lấy lại focus; vé có trạng thái USED sẽ ẩn mã QR. Phạm vi customer không bao gồm màn hình hoặc API quét/check-in.

```bash
# Kiểm tra linter
npm run lint

# Biên dịch TypeScript & Build Vite
npm run build

# Chạy test E2E Playwright
$env:PLAYWRIGHT_CHANNEL='chrome'; npm run test:e2e
```
