import "./not-found.css";
import Link from "next/link";

export default function NotFound() {
  return <main className="route-feedback">
    <p>404</p>
    <h1>Không tìm thấy trang</h1>
    <p>Đường dẫn có thể đã thay đổi hoặc không còn tồn tại.</p>
    <Link href="/">Về trang chính</Link>
  </main>;
}
