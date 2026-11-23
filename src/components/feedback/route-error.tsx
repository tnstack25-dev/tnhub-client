"use client";
import Link from "next/link";
import { Button, Result, Space } from "antd";

export function RouteError({ retry }: { error: unknown; retry: () => void; }) {
  return <div role="alert">
    <Result
      status="500"
      title="Chưa thể tải trang"
      subTitle="Đã xảy ra lỗi. Bạn có thể thử tải lại hoặc quay về trang chính."
      extra={<Space wrap>
        <Button type="primary" onClick={retry}>Thử lại</Button>
        <Link href="/">Về trang chính</Link>
      </Space>} />
  </div>;
}
