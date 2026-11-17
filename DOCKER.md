# Chạy EventHub bằng Docker

## 1. Cấu trúc và cách hoạt động

Đặt hai repo cạnh nhau như hiện tại, trên cùng nhánh có các file Docker tương ứng:

```text
DOAN/
├── eventhub-backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── src/main/resources/application-docker.properties
└── eventhub-frontend/
    ├── Dockerfile
    ├── .dockerignore
    ├── compose.yml
    ├── compose.external-db.yml
    ├── .env.docker.example
    └── docker/nginx/default.conf.template
```

Chạy các lệnh Compose bên dưới trong **eventhub-frontend**. Nếu BE ở thư mục khác, sửa `BACKEND_CONTEXT` trong `.env.docker`.

- `frontend`: build React/Vite bằng Node 24, phục vụ bằng Nginx tại `http://localhost:5173`.
- `backend`: build Maven, chạy Java 21 bằng user không có quyền root; API trực tiếp tại `http://localhost:8080/api` trên máy này.
- `postgres`: PostgreSQL 16, lưu dữ liệu trong named volume `eventhub_postgres_data`. Không chiếm cổng PostgreSQL 5432 của Windows.

Trình duyệt gọi `/api` cùng địa chỉ FE; Nginx chuyển tiếp đến `http://backend:8080/api`. Cấu hình proxy giữ cookie và tắt buffering cho thông báo SSE. Chatbot hiện tại chạy trong BE qua OpenRouter, không cần chạy repo `eventhub-ai` cho luồng này.

## 2. Tạo file cấu hình

Cài Docker Desktop, dùng Linux containers và đợi Docker Engine khởi động. Không cần cài Node/Java/Maven/PostgreSQL trên máy để chạy stack.

```powershell
cd D:\DOAN\eventhub-frontend
Copy-Item .env.docker.example .env.docker
```

Mở **`.env.docker`** và điền cấu hình. File này được Git bỏ qua, không được gửi vào build context. File `application-local.properties` của BE vẫn dành cho chạy trực tiếp trên máy; Docker không đọc file đó.

### Bắt buộc để khởi động

| Biến | Cần điền gì? |
| --- | --- |
| `DB_PASSWORD` | Mật khẩu PostgreSQL bạn tự đặt. Đây là mật khẩu **mới** cho DB Docker. Nếu dùng DB có sẵn theo mục 5, điền mật khẩu thật của DB đó. |
| `JWT_SECRET` | Khóa ngẫu nhiên Base64 chứa ít nhất 32 byte trước khi encode. Tạo bằng lệnh bên dưới. Giữ ổn định giữa các lần chạy. |
| `DB_NAME` | Giữ `eventhub_db` hoặc đặt tên DB mới. |
| `DB_USERNAME` | Giữ `eventhub` cho DB Docker; với DB có sẵn, điền user thật. |

Tạo khóa JWT bằng PowerShell, rồi chép kết quả vào `JWT_SECRET=`:

```powershell
$jwtBytes = New-Object byte[] 32
$jwtRng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$jwtRng.GetBytes($jwtBytes)
$jwtRng.Dispose()
[Convert]::ToBase64String($jwtBytes)
```

Ví dụ hình thức điền (thay phần mô tả bằng giá trị thật):

```dotenv
DB_NAME=eventhub_db
DB_USERNAME=eventhub
DB_PASSWORD='mat-khau-rieng-cua-ban'
JWT_SECRET=dan-ket-qua-Base64-vua-tao
```

Dùng dấu nháy đơn quanh mật khẩu chứa `$` hoặc `#` để Compose đọc đúng giá trị. Không dùng khóa JWT mẫu ở trên; đó chỉ là chỗ điền.

### Tùy chọn theo tính năng

| Nhóm | Biến cần điền | Nếu để trống/tắt |
| --- | --- | --- |
| Upload ảnh | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` từ tài khoản Cloudinary | Ứng dụng vẫn khởi động; upload ảnh chưa hoạt động. |
| Thanh toán VNPay | `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` do VNPay cấp; `VNPAY_RETURN_URL` là trang kết quả FE | Chưa tạo được URL thanh toán trả phí; các tính năng khác vẫn chạy. |
| Email vé | Đặt `PAYMENT_EMAIL_ENABLED=true`; điền `PAYMENT_EMAIL_FROM`, `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, `SPRING_MAIL_PASSWORD` | Mặc định `false`, không gửi email. |
| Chatbot | `OPENROUTER_API_KEY` và `OPENROUTER_MODEL` là ID model tài khoản được phép dùng | Chatbot chưa khả dụng; phần còn lại vẫn chạy. |

Bạn có thể chép các giá trị tương ứng từ `application-local.properties` vào các biến trên, **không chép cả tên thuộc tính Spring**. Ví dụ `spring.mail.username` tương ứng `SPRING_MAIL_USERNAME`, `app.vnpay.hash-secret` tương ứng `VNPAY_HASH_SECRET`.

Email dùng cổng `587` với STARTTLS theo cấu hình mẫu. Với Gmail, dùng App Password của tài khoản gửi. `PAYMENT_EMAIL_FROM` cần được nhà cung cấp SMTP cho phép gửi. Không bật email khi chưa cấu hình SMTP.

VNPay mặc định dùng Sandbox. `VNPAY_RETURN_URL=http://localhost:5173/customer/payment-result` là URL trả người dùng về FE. IPN là URL API công khai `https://<domain-public>/api/payments/vnpay/ipn` đăng ký ở VNPay; VNPay không gọi được `localhost`. Return URL riêng không thay thế IPN để xác nhận thanh toán.

### Cổng và địa chỉ truy cập

Các giá trị mặc định phù hợp cho máy hiện tại:

```dotenv
FRONTEND_PORT=5173
BACKEND_PORT=8080
AUTH_ALLOWED_ORIGINS=http://localhost:5173
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=Lax
VNPAY_RETURN_URL=http://localhost:5173/customer/payment-result
PAYMENT_EMAIL_FRONTEND_URL=http://localhost:5173
```

Nếu đổi FE sang cổng `3000`, sửa `FRONTEND_PORT=3000` và cả ba URL/origin có `5173` thành `3000`. Origin không có dấu `/` cuối hoặc đường dẫn; nhiều origin cách nhau bằng dấu phẩy. Không cần đổi `BACKEND_URL`/cổng nội bộ giữa container.

## 3. Khởi chạy

```powershell
# Kiểm tra file cấu hình; không in giá trị mật khẩu/khóa.
docker compose --env-file .env.docker config --quiet

# Build và chạy; chờ các healthcheck thành công.
docker compose --env-file .env.docker up -d --build --wait --wait-timeout 240

# Kiểm tra trạng thái và log.
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f backend
```

Mở **http://localhost:5173**. API kiểm tra nhanh: **http://localhost:5173/api/categories**. PostgreSQL sẵn sàng rồi BE mới khởi động; BE sẵn sàng rồi FE mới khởi động.

DB Docker ban đầu là **DB mới**, không tự dùng dữ liệu PostgreSQL trên Windows và không tự nạp `seeddata.sql`. Flyway tự tạo/cập nhật schema; DB mới chưa có tài khoản hay dữ liệu mẫu. Bạn có thể đăng ký CUSTOMER/ORGANIZER qua giao diện. Muốn dùng dữ liệu hiện có, xem mục 5.

## 4. Các lệnh thường dùng

```powershell
# Dừng stack, giữ nguyên dữ liệu DB.
docker compose --env-file .env.docker down

# Khi sửa cấu hình .env.docker, chạy lại để tạo container với giá trị mới.
docker compose --env-file .env.docker up -d --wait

# Khi sửa code, build lại image rồi chạy.
docker compose --env-file .env.docker up -d --build --wait

# Mở psql trong DB Docker.
docker compose --env-file .env.docker exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Đổi `DB_PASSWORD` trong `.env.docker` **không** đổi mật khẩu đã lưu trong PostgreSQL volume. Khi volume đã có dữ liệu, đổi mật khẩu bằng SQL rồi cập nhật cấu hình BE tương ứng. Tương tự, `DB_NAME` và `DB_USERNAME` chỉ khởi tạo DB/user ở lần đầu.

`down --volumes` xóa dữ liệu DB Docker; chỉ dùng khi chủ động muốn tạo lại DB trống. `down` thông thường giữ dữ liệu.

FE build sẵn để phục vụ bằng Nginx, không có hot reload. `VITE_API_BASE_URL=/api` đã được Compose truyền lúc build; không cần điền API host vào FE. Các biến `VITE_*` nằm trong JavaScript công khai sau build, vì vậy khóa JWT, Cloudinary secret, SMTP, VNPay và OpenRouter chỉ được truyền cho BE.

## 5. Dùng PostgreSQL có sẵn trên Windows hoặc dịch vụ DB ngoài

Trong `.env.docker`, điền user/mật khẩu thật của DB và thêm:

```dotenv
DB_USERNAME=postgres
DB_PASSWORD='mat-khau-db-hien-tai'
DB_URL=jdbc:postgresql://host.docker.internal:5432/eventhub_db
```

`host.docker.internal` là máy Windows từ bên trong container. `localhost` bên trong container là chính container BE. Với DB cloud, thay bằng hostname/port/DB thật và các tham số JDBC nhà cung cấp yêu cầu, ví dụ `?sslmode=require`.

Nếu đã chạy stack mặc định, dừng trước bằng `docker compose --env-file .env.docker down`, rồi chạy:

```powershell
docker compose --env-file .env.docker -f compose.yml -f compose.external-db.yml up -d --build --wait --wait-timeout 240
```

Override này chỉ chạy FE và BE, bỏ phụ thuộc vào PostgreSQL Docker. Khi dùng chế độ này, thêm cùng hai cờ `-f` vào các lệnh `ps`, `logs`, `down`, `up` tiếp theo. Trên Linux tự quản, cần cấu hình host mapping nếu dùng `host.docker.internal`.

PostgreSQL phải cho phép kết nối từ Docker. Dùng DB đã có đúng lịch sử Flyway của dự án; sao lưu DB cần giữ trước khi chạy vì Flyway sẽ áp dụng migration mới.

## 6. Khi đưa lên server/domain thật

- Dùng HTTPS qua reverse proxy/load balancer và đặt `AUTH_COOKIE_SECURE=true`.
- Đổi `AUTH_ALLOWED_ORIGINS=https://<domain-fe>`, `VNPAY_RETURN_URL=https://<domain-fe>/customer/payment-result`, `PAYMENT_EMAIL_FRONTEND_URL=https://<domain-fe>`.
- Tiếp tục chuyển `/api` cùng domain sang FE Nginx/BE. Giữ `AUTH_COOKIE_SAME_SITE=Lax` khi dùng cấu trúc cùng domain này.
- Dùng mật khẩu, JWT và API key riêng cho môi trường triển khai. Compose hiện tại là cấu hình chạy local, chưa tự cấp chứng chỉ HTTPS hay cấu hình sao lưu.

BE đã bỏ các giá trị mặc định nhạy cảm khỏi cấu hình đóng gói. Các giá trị đang dùng trên máy được giữ trong `application-local.properties` (Git bỏ qua), nên chạy BE trực tiếp vẫn dùng cấu hình local. Docker dùng các biến trong `.env.docker` riêng.

## 7. Xử lý lỗi nhanh

| Lỗi | Cách xử lý |
| --- | --- |
| Không kết nối được Docker Engine | Mở Docker Desktop, đợi Engine chạy, kiểm tra `docker version`. |
| Compose báo `DB_PASSWORD` hoặc `JWT_SECRET` chưa có | Điền hai biến bắt buộc và dùng `--env-file .env.docker`. |
| Port already allocated | Dừng tiến trình đang dùng cổng hoặc sửa `FRONTEND_PORT`/`BACKEND_PORT`. |
| BE unhealthy / không kết nối DB | Xem `logs backend` và `logs postgres`; kiểm tra mật khẩu của volume cũ hoặc `DB_URL` của DB ngoài. |
| Đăng nhập không giữ phiên trên local HTTP | Đặt `AUTH_COOKIE_SECURE=false`, dùng cùng hostname và điền đúng `AUTH_ALLOWED_ORIGINS`. |
| Có trang web nhưng API trả 502 | Kiểm tra BE healthy và Nginx/BE cùng mạng Compose. |
| Sửa `.env.docker` nhưng chưa có tác dụng | Chạy lại `up -d`; `restart` đơn thuần không cập nhật biến môi trường. |

Tham khảo: [Docker multi-stage build](https://docs.docker.com/build/building/multi-stage/), [Compose healthcheck và startup order](https://docs.docker.com/compose/how-tos/startup-order/), [biến môi trường Vite](https://vite.dev/guide/env-and-mode), [Nginx proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html).
