# Hướng dẫn làm việc trong EventHub Frontend

React + Vite + TypeScript. Chỉ triển khai trong phạm vi yêu cầu; không tạo code hoặc dữ liệu mẫu để lấp đầy thư mục.

## Nguồn thông tin

- Đọc `README.md`, `package.json` và các file liên quan trước khi chỉnh sửa.
- Dựa vào code và dependency hiện có; phân biệt cấu trúc dự kiến với chức năng đã triển khai.
- Làm việc và giải thích bằng tiếng Việt, giữ tên định danh trong code bằng tiếng Anh.

## Kiến trúc

- `src/App.tsx`, `src/main.tsx`: điểm khởi tạo ứng dụng, BrowserRouter và AuthProvider.
- `src/app/`: router và provider; không tạo thêm `App.tsx` ở đây nếu component gốc vẫn nằm tại `src/App.tsx`.
- `src/features/example/`: khung tham khảo; đặt tên feature theo nghiệp vụ khi triển khai.
- `src/features/<feature>/`: toàn bộ code riêng của một tính năng.
  - `pages/`: màn hình thuộc tính năng.
  - `components/`: thành phần giao diện riêng.
  - `hooks/`: logic React riêng.
  - `api/`: hàm gọi backend của tính năng.
  - `types/`: kiểu dữ liệu của tính năng.
  - `data/`: dữ liệu tĩnh khi thực sự cần.
- `src/pages/`: page cấp ứng dụng không thuộc một tính năng cụ thể.
- `src/components/ui/`: chỉ bổ sung khi được yêu cầu; hiện JSX được viết trực tiếp trong page auth.
- `src/components/common/`: hiện chưa có component dùng chung.
- Hiện không dùng layout riêng; header, nền, footer nằm trong từng page auth.
- `src/hooks/`, `src/types/`, `src/utils/`: code dùng chung giữa các tính năng.
- `src/lib/`: cấu hình thư viện hoặc HTTP client khi triển khai.
- `src/config/`, `src/constants/`: cấu hình và hằng số dùng chung.
- `src/styles/`: CSS toàn cục và biến giao diện khi cần.
- `src/assets/`: tài nguyên được import trong code; `public/`: tài nguyên truy cập trực tiếp bằng URL.

Giữ page nghiệp vụ trong feature, không gom tất cả page về `src/pages/`. Code dùng chung không phụ thuộc ngược vào feature. Tránh import chi tiết nội bộ giữa các feature; khi cần chia sẻ, xác định rõ trách nhiệm của phần dùng chung.

Quy tắc không phụ thuộc feature áp dụng cho UI, hook và tiện ích dùng chung. `App.tsx`, router và page cấp ứng dụng được phép ghép thành phần từ các feature. Khi triển khai nghiệp vụ mới, dùng tên feature cụ thể như `events`, `auth` hoặc `bookings` và chỉ tạo các thư mục con cần thiết.

Không tạo thư mục con hoặc lớp trừu tượng khi chưa có nhu cầu. Xóa `.gitkeep` trong thư mục khi đã thêm file thật.

## Quy ước code khi triển khai

- Viết React function component bằng TypeScript.
- Component, page, layout dùng PascalCase; hook bắt đầu bằng `use`; file tiện ích dùng kebab-case.
- Định nghĩa kiểu dữ liệu rõ ràng, tránh `any` và không tắt kiểm tra để che lỗi.
- Giữ state cục bộ khi chỉ một component sử dụng; không thêm thư viện quản lý state khi chưa cần.
- Đặt CSS riêng cạnh page/component dưới dạng `TenComponent.module.css`.
- Chỉ đưa reset, font, biến CSS và kiểu thực sự dùng toàn ứng dụng vào CSS toàn cục.
- CSS toàn cục nằm trong `src/styles/global.css`; `App.css` và `index.css` mặc định đã được bỏ. Tránh sao chép cùng một bộ style ở nhiều nơi.
- Hiện tại dùng import tương đối. Alias `@/` chưa được cấu hình; nếu thêm, cấu hình đồng bộ Vite và TypeScript.
- Khi tích hợp API, đặt hàm gọi backend trong feature và cấu hình client dùng chung trong `lib/`; xử lý loading, lỗi và dữ liệu rỗng theo yêu cầu tính năng.
- Không giả định endpoint, cơ chế xác thực hay hợp đồng backend khi chưa có thông tin.

## Dependency và cấu hình

- Dùng npm và lockfile hiện có.
- Hiện có React, React DOM, Vite, TypeScript, Oxlint, React Router và Lucide React.
- API dùng Axios trong `src/lib/http-client.ts`, có cookie, CSRF và interceptor tự refresh khi gặp 401. Các API nghiệp vụ phải dùng client này để được xử lý phiên thống nhất. Playwright kiểm thử auth và refresh với API giả lập. Prettier chưa được cài đặt.
- Không tự nâng phiên bản hoặc đổi công cụ trong tác vụ không liên quan.
- Không đưa thông tin bí mật vào frontend. Khi bổ sung cấu hình môi trường, dùng ví dụ công khai và cấu hình `.gitignore` phù hợp.

## Quy trình và kiểm tra

1. Kiểm tra thay đổi hiện có, giữ nguyên công việc của người khác ngoài phạm vi yêu cầu.
2. Chỉnh sửa tối thiểu để hoàn thành tác vụ; tránh đổi cấu trúc toàn dự án khi chỉ sửa một tính năng.
3. Cập nhật README khi thay đổi cấu trúc, lệnh chạy hoặc dependency liên quan.
4. Khi thay đổi code hoặc cấu hình, chạy `npm run lint` và `npm run build`.
5. Nếu chỉ sửa tài liệu, kiểm tra nội dung khớp với cây thư mục và script thực tế. Khi rà soát bộ khung, kiểm tra cả asset tham chiếu trong HTML/JSX; build thành công không đảm bảo file được gọi bằng URL như `/icons.svg` đang tồn tại.
6. Báo rõ đã thay đổi gì, đã kiểm tra gì và phần nào còn chưa triển khai.

Dùng `npm run test:e2e` khi sửa luồng auth. Test Playwright giả lập API, không thay thế kiểm thử với backend/PostgreSQL thật. Không tự commit hoặc push nếu người dùng chưa yêu cầu.
