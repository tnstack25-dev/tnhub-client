"use client";

export default function GlobalError({ retry }: { error: unknown; retry: () => void; }) {
  return <html lang="vi">
    <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
      <title>Không thể tải TNHub</title>
      <main role="alert" style={{ maxWidth: 560, margin: "15vh auto", padding: 24 }}>
        <h1>Không thể tải TNHub</h1>
        <p>Ứng dụng tạm thời gặp sự cố. Vui lòng thử lại.</p>
        <button onClick={retry} style={{ padding: "10px 20px", cursor: "pointer" }}>Thử lại</button>
      </main>
    </body>
  </html>;
}
