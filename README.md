# EventHub Frontend

Bộ khung **React + Vite + TypeScript** cho nhóm 4 người, tổ chức theo tính năng (`features`).

Hiện tại mã nguồn chỉ có **các file mặc định của template Vite React TypeScript và cấu trúc thư mục trống**, kèm README và CLAUDE.md hướng dẫn phát triển. Chưa triển khai page nghiệp vụ, routing, API, hook hay component riêng của EventHub. Khi chạy ứng dụng, bạn sẽ thấy giao diện mặc định của Vite.

## Khởi chạy

Môi trường đã kiểm tra: Node.js 24 và npm 11.

```bash
npm ci
npm run dev
```

Mở địa chỉ hiển thị trong terminal, thường là `http://localhost:5173`.

## Công cụ hiện có

- React và React DOM.
- Vite và plugin React.
- TypeScript.
- Oxlint theo template mặc định.

React Router, Axios và Prettier chưa được cài đặt trong bộ khung này. Nhóm sẽ bổ sung thư viện khi triển khai chức năng cần đến chúng. Chưa cấu hình alias `@/`; hiện dùng import tương đối.

## Cấu trúc thư mục

```text
eventhub-frontend/
├── public/                     # Tài nguyên tĩnh mặc định của Vite
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── app/                    # Dành cho router, provider khi triển khai
│   ├── assets/                 # Asset mặc định của template
│   │   ├── icons/              # Dành cho icon của dự án
│   │   ├── images/             # Dành cho hình ảnh của dự án
│   │   ├── hero.png            # Asset mặc định của template
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components/
│   │   ├── common/             # Thành phần dùng chung: Header, Footer...
│   │   └── ui/                 # UI cơ bản: Button, Input, Modal...
│   ├── config/                 # Cấu hình ứng dụng, môi trường
│   ├── constants/              # Hằng số dùng chung
│   ├── features/
│   │   └── example/            # Khung minh họa, chưa phải tính năng thật
│   │       ├── api/            # Hàm gọi API của tính năng
│   │       ├── components/     # Component chỉ dùng trong tính năng
│   │       ├── data/           # Dữ liệu tĩnh của tính năng nếu cần
│   │       ├── hooks/          # Hook của tính năng
│   │       ├── pages/          # Page thuộc tính năng
│   │       └── types/          # Kiểu dữ liệu của tính năng
│   ├── hooks/                  # Hook dùng chung
│   ├── layouts/                # Khung giao diện dùng chung
│   ├── lib/                    # Cấu hình thư viện, HTTP client khi cần
│   ├── pages/                  # Page cấp ứng dụng: Home, NotFound...
│   ├── styles/                 # CSS toàn cục và biến CSS khi triển khai
│   ├── types/                  # Kiểu dữ liệu dùng chung
│   ├── utils/                  # Hàm tiện ích dùng chung
│   ├── App.tsx                 # Component mặc định của Vite
│   ├── App.css                 # CSS mặc định của App
│   ├── index.css               # CSS mặc định toàn cục
│   └── main.tsx                # Entry point mặc định
├── .gitignore
├── .oxlintrc.json
├── CLAUDE.md                   # Hướng dẫn làm việc với trợ lý AI
├── README.md
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

Các mô tả bên cạnh thư mục thể hiện **mục đích sử dụng sau này**, không có nghĩa chức năng đã được triển khai. Thư mục trống chứa `.gitkeep` để Git lưu lại cấu trúc; đây không phải file triển khai. Xóa `.gitkeep` khi thư mục có file thật.

`features/example/` chỉ là mẫu tổ chức thư mục. Khi triển khai nghiệp vụ, tạo feature có tên cụ thể như `events`, `auth` hoặc `bookings` với các thư mục con cần dùng; không viết nghiệp vụ thật vào `example/`.

`node_modules/` và `dist/` được sinh khi cài dependency hoặc build, không thuộc mã nguồn và đã được bỏ qua trong Git.

## Quy ước phát triển

### Page và feature

- Page thuộc nghiệp vụ nào đặt tại `features/<tinh-nang>/pages/`.
- `src/pages/` dành cho trang cấp ứng dụng không thuộc riêng một tính năng, ví dụ Home và NotFound.
- API, hook, component và type riêng nằm trong feature tương ứng.
- Component hoặc logic được nhiều tính năng sử dụng mới chuyển ra thư mục dùng chung.
- Code dùng chung không import ngược từ `features/`. Hạn chế các feature phụ thuộc trực tiếp vào chi tiết triển khai của nhau.
- Khi thêm tính năng, chỉ tạo thư mục con thực sự cần; không bắt buộc sao chép toàn bộ khung `example/`.
- `App.tsx` hiện là component gốc được `main.tsx` render. `app/` dành cho router và provider sau này; không cần tạo thêm một `App.tsx` trong đó.
- Quy tắc dùng chung không import feature áp dụng cho UI, hook và tiện ích dùng chung. `App.tsx`, router và page cấp ứng dụng có thể ghép các thành phần từ feature khi triển khai.

### CSS

Khi bắt đầu viết giao diện, đặt CSS riêng cạnh page/component và dùng tên `TenComponent.module.css`. Ví dụ dưới đây chỉ minh họa cho tính năng sự kiện sau này, chưa tồn tại trong bộ khung hiện tại:

```text
features/events/pages/
├── EventsPage.tsx
└── EventsPage.module.css
```

`src/styles/` dành cho reset, font, biến màu sắc và kiểu toàn cục. Không gom CSS của từng tính năng vào một file chung. `App.css` và `index.css` hiện vẫn giữ nguyên theo template; điều chỉnh khi thay thế giao diện mặc định. Khi chuyển CSS toàn cục sang `styles/`, cập nhật import tương ứng và tránh duy trì cùng một bộ style ở hai nơi.

### Đặt tên và làm việc nhóm

- Component, page, layout: PascalCase (`EventCard.tsx`).
- Hook: bắt đầu bằng `use` (`useEvents.ts`).
- File tiện ích: kebab-case (`format-date.ts`).
- Chia công việc theo feature; trao đổi khi sửa router, layout, cấu hình hoặc component dùng chung.
- Dùng npm thống nhất. Commit `package-lock.json` cùng thay đổi dependency; không chỉnh lockfile bằng tay.
- Không thêm thư viện, dữ liệu mẫu hoặc tính năng ngoài phạm vi công việc đang thực hiện.

## Các lệnh

```bash
npm run dev      # Dev server
npm run lint     # Kiểm tra code bằng Oxlint
npm run build    # Kiểm tra TypeScript và build vào dist/
npm run preview  # Xem bản build tại máy local
```

Chạy `npm run lint` và `npm run build` trước khi gửi thay đổi code để review. Dự án chưa cấu hình công cụ kiểm thử tự động.
