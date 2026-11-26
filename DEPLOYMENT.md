# Deploy client TNHub

Domain production: `https://pm.tnstack.com`.

Workflow `.github/workflows/ci.yml` chạy check/build trên PR; khi push `main`, build
Docker image Next.js standalone lên GHCR với tag `sha-<commit>`. Nếu repository
variable `DEPLOY_ENABLED=true`, workflow SSH tới VPS và cập nhật service `client`.
Build hỗ trợ amd64 và arm64; server build không chạy trên VPS.

Trong GitHub, tạo Environment `production` và secrets `VPS_HOST`, `VPS_USER`,
`VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`, tùy chọn `VPS_PORT` (mặc định 22).
SSH host key phải được xác minh trước. Workflow dùng `GITHUB_TOKEN` để publish GHCR.
VPS cần đăng nhập GHCR với quyền đọc package nếu package private.

Đặt `DEPLOY_ENABLED=false` trong lần chuẩn bị đầu để chỉ tạo image. Sau khi setup
VPS và khởi động lần đầu thành công, đặt `true` để bật deploy tự động.

Cấu hình dùng chung, hướng dẫn FastPanel, database, secret và backup nằm trong
repo server (`tnstack25-dev/tnhub`), file `deploy/README.md`. Copy thư mục đó tới
`/opt/tnhub/deploy` trên VPS trước khi bật auto deploy. Không cần PM2.

Client nhận runtime env từ `/opt/tnhub/deploy/client.env`:

```dotenv
NODE_ENV=production
API_URL=http://api:3000/api/v1
NEXTAUTH_URL=https://pm.tnstack.com
NEXTAUTH_SECRET=<random-secret>
AUTH_INTERNAL_SECRET=<same-as-server>
AUTH_COOKIE_NAME=refresh_token
```

API public là `https://pmapi.tnstack.com/api/v1`; client BFF dùng mạng Docker nội bộ.
Docker image không chứa `.env.local`/secret production. Docker build dùng placeholder
chỉ để kiểm tra build; phải cấp secret thật khi chạy container.

Sau khi build standalone, chạy `node .next/standalone/server.js` nếu muốn thử output
trực tiếp. Dockerfile đã copy `public` và `.next/static` tới các vị trí cần thiết.
