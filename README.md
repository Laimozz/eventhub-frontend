# EventHub Frontend

React + Vite + TypeScript, tổ chức theo tính năng. Đã triển khai giao diện đăng ký, đăng nhập và trang sau đăng nhập chỉ có nút đăng xuất, kết nối API của `eventhub-backend`.

## Khởi chạy

Môi trường: Node.js 24, npm 11.

```bash
npm ci
npm run dev
```

Mở `http://localhost:5173`. Chạy backend ở `http://localhost:8080`, cấu hình PostgreSQL và khóa JWT Base64 hợp lệ theo README backend. Vite chuyển tiếp `/api` đến backend; cổng 5173 được cố định để khớp CORS. Local HTTP dùng `AUTH_COOKIE_SECURE=false`.

Không cần tạo file môi trường để chạy mặc định. Khi cần đổi URL API, copy `.env.example` thành `.env.local` và đặt `VITE_API_BASE_URL`, ví dụ `http://localhost:8080/api`. Khởi động lại Vite sau khi đổi. Đây là cấu hình công khai, không đặt JWT secret hoặc mật khẩu database vào frontend. Nếu gọi khác origin, backend phải cho phép origin frontend và credentials; dùng cùng hostname (`localhost` hoặc `127.0.0.1`) nhất quán.

## Luồng đã triển khai

| Đường dẫn | Hành vi |
| --- | --- |
| `/register` | Đăng ký CUSTOMER hoặc ORGANIZER; thành công chuyển sang đăng nhập, chưa tạo phiên. |
| `/login` | Chỉ nhập email, mật khẩu và đăng nhập; không có đăng nhập mạng xã hội hoặc mô phỏng kiểm thử. |
| `/` | Yêu cầu đăng nhập; nền trắng chỉ có nút đăng xuất. |

Đã đăng nhập thì `/login` và `/register` chuyển về `/`. Đường dẫn không tồn tại chuyển về `/`, rồi kiểm tra phiên. Giao diện dùng nhận diện EventHub với bố cục và màu xanh theo mẫu.

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

## Cấu trúc code

```text
src/
├── app/                    # AppRouter, AuthProvider
├── features/auth/
│   ├── api/                # Các endpoint và thông báo lỗi auth
│   ├── hooks/              # useAuth, context
│   ├── pages/              # LoginPage, RegisterPage: tự chứa toàn bộ giao diện
│   └── types/              # Request, User, role
├── lib/                    # Axios client: cookie, CSRF, timeout, tự refresh
├── pages/                  # HomePage với nút đăng xuất
├── styles/                 # Reset, font, biến CSS toàn cục
├── App.tsx
└── main.tsx
tests/                      # Kiểm thử trình duyệt với API giả lập
```

Các thư mục trống có sẵn còn lại được giữ cho tính năng sau. `features/example/` chỉ là khung tham khảo. Component và page dùng PascalCase; hook bắt đầu bằng `use`; tiện ích dùng kebab-case. Hiện không tách Button, FormField, Brand, AuthCard hoặc layout riêng: các page auth chứa trực tiếp JSX, header, footer, nút và ô nhập. CSS của hai page nằm trong `AuthPage.module.css`; HomePage tự chứa nút đăng xuất và CSS của nó. Không gom CSS nghiệp vụ vào global.

Dependency: React Router cho routing ([tài liệu chính thức](https://reactrouter.com/start/declarative/routing)), Lucide React cho icon. HTTP dùng Axios với instance và response interceptor trong `lib/http-client.ts`. Playwright là dev dependency để kiểm thử giao diện.

## Kiểm tra và build

```bash
npm run lint
npm run build
npx playwright install chromium  # Chỉ cần làm lần đầu
npm run test:e2e
```

Nếu không tải được Chromium nhưng đã cài Google Chrome, có thể chạy trong PowerShell: `$env:PLAYWRIGHT_CHANNEL='chrome'; npm run test:e2e`.

Test tự chạy Vite tại `127.0.0.1:4173`, kiểm tra desktop và mobile với API giả lập: quyền truy cập trang, đăng ký hai role, validation, email trùng, cookie HttpOnly, khôi phục phiên, đăng nhập/đăng xuất, lỗi mạng và tự refresh token. Bộ kiểm thử refresh gọi Axios client thật qua Vite và giả lập endpoint được bảo vệ, không thêm nút kiểm thử vào ứng dụng. Không cần backend/database và không tạo tài khoản thật. Kết quả không thay thế kiểm thử tích hợp với backend thật. `test-results/` được Git bỏ qua.

`npm run preview` xem build production tại máy local. Proxy `/api` chỉ có trong dev server: để preview hoặc triển khai thực tế, cấu hình `VITE_API_BASE_URL` trước khi build hoặc dùng reverse proxy `/api` đến backend. Server phục vụ frontend cần fallback các đường dẫn SPA về `index.html`; HTTPS cần cookie Secure và cấu hình SameSite/CORS phù hợp.

Chạy lint, build và test liên quan trước khi gửi thay đổi. Dùng npm và commit lockfile cùng thay đổi dependency. Không tự nâng phiên bản hoặc thêm tính năng ngoài phạm vi yêu cầu.
