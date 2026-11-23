# TNHub Client

Ứng dụng quản trị dùng Next.js App Router, React, Ant Design và TanStack Query. Yêu cầu Node.js 24 trở lên.

## Giao diện Ant Design

Client dùng Ant Design 6 cho form xác thực, input/password, validation, button,
alert, select theme, menu/sidebar, drawer mobile, dropdown tài khoản, bảng và
phân trang dịch vụ, card/statistic trên dashboard và descriptions của hồ sơ.
Ant Design là thư viện UI duy nhất; icon dùng `@ant-design/icons`.
Bố cục workspace dùng `Layout`, `Flex`, `Row`/`Col`. `src/app/globals.css` chỉ chứa nền, font và trạng thái tải chung. CSS riêng của trang/component được đặt cạnh mã nguồn và import trực tiếp tại nơi sử dụng; không có utility framework.

- `src/providers/antd-provider.tsx`: locale tiếng Việt, token thương hiệu,
  thuật toán light/dark theo `next-themes`, và context `App` cho feedback.
- `src/app/layout.tsx`: `AntdRegistry` thu thập CSS khi SSR; boundary
  `Suspense` tương thích Cache Components của Next.js. Reset CSS dùng `antd/dist/reset.css`;
  không cần cấu hình PostCSS riêng.
- Theme dùng namespace CSS riêng `tnhub-light`/`tnhub-dark` để component token
  cập nhật đúng khi đổi theme mà không remount và làm mất dữ liệu form.
- `src/components/auth/auth-ui.tsx`: field/form feedback dùng chung; các form dùng
  `Form.onFinish`, validation của Ant Design và giữ payload API hiện có.
- `src/features/services/components/service-table.tsx`: `Table`/`Tag`, phân trang phía server
  theo `meta.page`, `meta.limit`, `meta.total`; không tải toàn bộ danh mục về client.
- Provider/query/auth được giữ ở các boundary client cần thiết; các page/layout
  kiểm tra phiên phía server vẫn giữ nguyên trách nhiệm.

Khi thêm màn hình, ưu tiên component Ant Design và token chung thay vì tự viết
control hoặc thêm thư viện UI khác. Kiểm tra bằng `npm run lint`,
`npm run typecheck` và `npm run build`. Các luồng gửi email và Google OAuth vẫn
phụ thuộc cấu hình backend tương ứng.

Tham khảo: [Ant Design App Router](https://ant.design/docs/react/use-with-next/)
và [Ant Design theming](https://ant.design/docs/react/customize-theme/).

## Tổ chức CSS

- `src/app/globals.css`: nền/font ứng dụng, app root và loading chung; root layout chỉ import stylesheet nền tảng này và reset của Ant Design.
- `src/app/(auth)/auth-layout.css`: bố cục các trang xác thực; `src/components/auth/auth-ui.css`: control, heading và feedback xác thực dùng chung.
- `src/components/layout/workspace-shell.css`: sidebar, header, điều hướng và menu tài khoản.
- `src/components/admin/admin.css`: khung quản trị và drawer dùng chung cho roles/permissions/users/services; không tạo bản sao cho từng trang khi dùng cùng component.
- `src/features/account/account.css`, `change-password.css`, `src/features/dashboard/dashboard.css`, `src/features/services/services.css`, `src/features/media/media.css`, `src/features/audit-logs/audit-logs.css`: CSS theo trang/feature tương ứng.
- `src/features/media/components/media-picker-{field,modal,library,upload}.css`: CSS riêng của từng phần trong bộ chọn ảnh dùng lại giữa nhiều module.
- `src/app/not-found.css`: trang 404.

Mỗi stylesheet giữ cả media query của chính nó. Component/feature sở hữu import CSS; không gom các stylesheet riêng qua `globals.css`. Giữ prefix class theo trang/component để tránh xung đột khi chuyển route.

## Module quản trị

Các route độc lập: `/roles`, `/permissions`, `/users`, `/services`, `/account`, `/dashboard`.
Đường dẫn `/access/*` cũ được chuyển hướng trong `next.config.ts`.

- `src/features/<module>`: giao diện, types và API/query theo module. Roles/permissions/users/services tự khai báo cột bảng, quyền, thao tác và drawer.
- `src/components/admin`: khung bảng và form editor dùng chung, không import feature.
- `src/features/admin`: nghiệp vụ được chia sẻ giữa các màn quản trị (catalog, gán quyền và chi tiết). Editor người dùng/dịch vụ và batch dịch vụ nằm trong feature tương ứng.
- `src/lib/admin`: API/query quản trị dùng chung và whitelist endpoint. Contract dùng chung ở `src/lib/contracts`; domain types nằm trong feature.
- `src/lib/auth/profile-query.ts`, `contracts.ts`, `permissions.ts`: profile query, contract và quyền dùng chung; client không import từ module backend có `server-only`.
- `src/components/layout/workspace-shell.tsx`: bố cục workspace.
- `src/lib/query-keys.ts`: query keys và phạm vi invalidation; thay đổi dịch vụ không làm mới toàn bộ dữ liệu người dùng.
- `src/lib/theme/palette.ts`: nguồn màu duy nhất cho CSS variables và Ant Design token, light/dark/system.
- `src/app/api/manage/[...path]`: proxy xác thực cho roles, permissions, users, services; kiểm tra Origin với yêu cầu ghi, giới hạn path/method.

Vai trò, quyền và người dùng hỗ trợ chi tiết, tạo/sửa, tìm/lọc/phân trang, xóa mềm,
thùng rác, khôi phục và xóa vĩnh viễn; có xử lý hàng loạt theo quyền tương ứng.
Hệ thống và tài khoản đang đăng nhập được bảo vệ ở UI; backend vẫn quyết định
quyền thao tác, cấp bậc và các điều kiện xóa. Kết quả hàng loạt hiển thị các mục bị bỏ qua.

Dịch vụ hỗ trợ chi tiết, tạo/sửa, giá, lọc danh mục/trạng thái, sắp xếp, bật/tắt,
xóa vĩnh viễn và tạo/sửa nhiều dòng. Mã dịch vụ bất biến khi cập nhật;
đổi trạng thái dùng endpoint riêng đúng contract backend.

Hồ sơ cho phép cập nhật thông tin cá nhân; phiên đăng nhập hỗ trợ phân trang, thu hồi
từng phiên, các thiết bị khác hoặc tất cả. Thu hồi phiên hiện tại đóng session client.
Gán vai trò/quyền tải đầy đủ danh mục trước khi lưu; có xác nhận thay thế, cảnh báo
thay đổi chưa lưu và thông báo bỏ thời hạn khi API gán lại vai trò.

Kiểm tra: `npm run check` và `npm run build`.

## Media và audit log

- `/media`: thư viện ảnh dạng lưới/bảng, tìm kiếm, lọc định dạng/người tải,
  xem chi tiết, sửa mô tả thay thế, sao chép URL và tải nhiều ảnh tuần tự.
  Thùng rác hỗ trợ khôi phục/xóa vĩnh viễn, thao tác hàng loạt tối đa 50 ảnh.
- `/audit-logs`: tra cứu theo sự kiện, mức độ, người thực hiện và khoảng thời gian;
  xem metadata, trạng thái kiểm tra chữ ký và xuất JSON theo bộ lọc đang áp dụng.
  Backend giới hạn mỗi lần xuất 10.000 bản ghi, giao diện cảnh báo khi bị giới hạn.
- Quyền: `media.read/create/update/delete/restore/hard_delete` và
  `audit.read/export`. UI ẩn thao tác không có quyền; NestJS kiểm tra lại mọi yêu cầu.
- BFF `/api/manage` chỉ cho phép endpoint/method đã khai báo; audit chỉ đọc.
  Upload multipart được chuyển qua Next.js tới NestJS, giới hạn 10 MB/ảnh,
  hỗ trợ JPEG/PNG/GIF/WebP/AVIF. Backend tiếp tục kiểm tra chữ ký file và giới hạn riêng.
  Cấu hình Cloudinary nằm ở NestJS; client không nhận khóa storage.
- `src/features/media`, `src/features/audit-logs`: màn hình và truy vấn theo module.
  `src/lib/media/validation.ts`, `src/lib/audit/filters.ts`: kiểm tra dữ liệu đầu vào.
- Kiểm tra: `npm test`. Bộ test dùng HTTP adapter giả lập để kiểm tra contract, upload thất bại một phần, session refresh đồng thời, 401/403 và cache. Các test này không thay thế kiểm tra trình duyệt với NestJS, Redis và Cloudinary thật.

## Bộ chọn ảnh dùng chung

- Thẻ hồ sơ bên trái hiển thị avatar lớn và một nút **Thay đổi ảnh đại diện** ngay bên dưới. Ảnh xem trước được cập nhật trên thẻ; thao tác gỡ nằm trong popup. Hồ sơ dùng ảnh từ media qua `avatarMediaId`. Chọn/gỡ ảnh chỉ cập nhật form; bấm **Lưu hồ sơ** mới lưu. Ảnh ở hồ sơ và menu tài khoản cập nhật sau khi lưu thành công. Avatar URL cũ (ví dụ Google) vẫn hiển thị cho đến khi thay/gỡ.
- `src/features/media/components/media-picker-modal.tsx`: popup hai tab Thư viện/Tải ảnh lên, tìm debounce 400 ms, phân trang và lọc ảnh tự tải. Chọn một/nhiều ảnh, giới hạn số ảnh, xem trước, hỗ trợ bàn phím. Bộ lọc popup độc lập với URL của màn hình đang mở.
- Quyền giữ nguyên backend: `media.read` để xem/chọn thư viện; `media.create` để tải lên. Tài khoản chỉ có quyền tải có thể sử dụng ảnh vừa tải. Gỡ avatar không xóa media. Không có thao tác xóa/quản trị trong popup.
- Upload dùng lại giới hạn 10 MB và JPEG/PNG/GIF/WebP/AVIF. Ảnh tải thành công tự được chọn, vẫn nằm trong thư viện nếu hủy popup; file lỗi được giữ để thử lại. Đóng/chuyển tab bị khóa khi đang tải. Khi xác nhận, ảnh thư viện được kiểm tra lại để tránh dùng ảnh đã bị xóa.
- `MediaPickerModal` nhận `open`, `selectedIds`, `multiple`, `maxCount`, `allowUpload`, `title`, `confirmText`, `onCancel`, `onClear?`, `onConfirm(items: MediaItem[])`. Module gọi tự xử lý lưu dữ liệu.
- `MediaPickerField` là control cho Ant Design Form, dùng `value/onChange` dạng `MediaPickerValue[]`; mỗi mục gồm media ID, URL và thông tin xem trước. Có thể truyền `disabled`, `shape`, `presentation="avatar"` (avatar lớn, nút đổi ảnh ở dưới), `chooseText` và các tùy chọn một/nhiều ảnh. Popup chỉ được tải mã khi mở.

Ví dụ dùng trong module khác:

```tsx
import { MediaPickerField } from "@/features/media/components/media-picker-field";

<Form.Item name="images" label="Ảnh bài viết" initialValue={[]}>
  <MediaPickerField multiple maxCount={5} title="Chọn ảnh bài viết" />
</Form.Item>
```

Khi lưu, module lấy `images.map(image => image.id)` để gửi các ID cho API tương ứng. Backend của module đó cần kiểm tra và lưu quan hệ media theo contract của chính module.

## Authentication

From `server`, run `docker compose up -d redis` and start NestJS on port 3000.
Copy the values from `.env.example` into `.env.local`, keeping any existing
settings. Generate a private `NEXTAUTH_SECRET` with
`node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`.
Generate a second value with the same command for `AUTH_INTERNAL_SECRET`
and set it in both the Next.js and NestJS server environments. Set
`AUTH_REDIS_URL` in NestJS to the Redis instance that holds the sessions.
Start the client with `npm run dev` and sign in at
`http://localhost:5173/login` with an active, verified NestJS account.

Next.js calls NestJS using the server-only `API_URL`. NestJS owns the Redis
connection and exposes the session store to Next.js through authenticated
server-to-server requests under `/api/v1/internal/auth`. The browser calls
`/api/me`, `/api/services`, and `/api/session/logout` on the Next.js origin.
Set `AUTH_COOKIE_NAME` to the refresh cookie name configured in NestJS.
In production, set `NEXTAUTH_URL` to the public HTTPS origin and share
`NEXTAUTH_SECRET` across Next.js instances. Use HTTPS for the internal API
in production and configure the NestJS instances to use the same private,
access-controlled Redis instance with TLS and no eviction for session data.
Keep `AUTH_COOKIE_SECURE=true` in production NestJS.

The account pages are `/register`, `/verify-email`, `/forgot-password`,
`/reset-password`, and `/change-password`. Set NestJS `APP_PUBLIC_URL` to
`http://localhost:5173` in development and the public Next.js origin in
production so the verification and reset emails open the correct pages.
Configure SMTP in NestJS to deliver those emails.

Google sign-in and registration use the same NestJS OAuth endpoints. Enable
`GOOGLE_OAUTH_ENABLED` and set NestJS `GOOGLE_CALLBACK_URL` to
`http://localhost:5173/api/v1/auth/google/callback` in development. Add that
exact URI to the existing Google OAuth client's authorized redirect URIs.
In production, use the equivalent public HTTPS URL and route that path
to Next.js. Leave `GOOGLE_OAUTH_SUCCESS_REDIRECT_URL` empty for this client.

The development and build scripts use Webpack because Turbopack's CSS worker
fails to start in the current Windows environment.

## Quy ước kiến trúc

- `app` ghép route/layout và BFF; `features` không import từ `app`.
- `components`, `providers` và `lib` không import từ `app` hoặc `features`. ESLint chặn các import ngược này.
- Feature dùng `*-types.ts` cho contract, `*-api.ts` cho HTTP và `*-queries.ts` cho truy vấn/cache. CRUD quản trị dùng các hook generic trong `lib/admin`.
- URL lưu trạng thái danh sách cần khôi phục/chia sẻ: trang, kích thước trang, tìm kiếm, bộ lọc, sắp xếp, thùng rác. Media lưu thêm chế độ lưới/bảng và phạm vi người tải. Drawer và lựa chọn tạm thời dùng state cục bộ; lựa chọn không được áp dụng sang bộ lọc khác.
- Parser URL nằm trong `src/lib/url/list-parsers.ts`; adapter nuqs ở root layout. Thay bộ lọc đưa danh sách về trang 1. Audit giữ timestamp ISO trong URL và chuyển sang giờ thiết bị khi hiển thị form.
- `src/lib/env/server.ts` kiểm tra cấu hình server khi sử dụng; lỗi chỉ nêu tên biến, không in giá trị secret.
- `app/error.tsx`, `(protected)/error.tsx`, `global-error.tsx`, `not-found.tsx` và `(protected)/loading.tsx` cung cấp trạng thái lỗi/tải. Global error dùng HTML độc lập để vẫn hoạt động khi provider lỗi.
- Khi đổi phiên đăng nhập, dùng `clearSessionCache` để hủy truy vấn đang chạy trước khi xóa cache.

## Chạy và kiểm tra

Giữ cấu hình đang có trong `.env.local`; tham khảo `.env.example` và mục Authentication ở trên.

```sh
npm ci
npm run dev
```

```sh
npm run check   # lint + sinh route types/TypeScript + test
npm run build  # production build
npm start
```

Test dùng Node test runner và TypeScript đã có trong dự án, không cần thêm test framework. Loader trong `tests/support/register.mjs` xử lý alias/TypeScript và bỏ marker client-only/server-only trong môi trường test; production build vẫn kiểm tra ranh giới này.

CI ở `.github/workflows/ci.yml` chạy trên Node 24: cài từ lockfile, chạy check rồi build. Các biến môi trường trong CI là placeholder chỉ dùng kiểm tra build, không dùng triển khai.
