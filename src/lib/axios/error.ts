
import axios from "axios";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ErrorPayload = {
  message?: string | string[];
  code?: string;
  errors?: unknown;
};

export function normalizeApiError(
  error: unknown,
): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (!axios.isAxiosError<ErrorPayload>(error)) {
    return new ApiError(
      "Đã xảy ra lỗi không xác định",
      0,
    );
  }

  if (error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT") {
    return new ApiError(
      "Yêu cầu quá thời gian chờ",
      0,
      "TIMEOUT",
    );
  }

  if (!error.response) {
    return new ApiError(
      "Không thể kết nối đến máy chủ",
      0,
      "NETWORK_ERROR",
    );
  }

  const { status, data } = error.response;

  const message = Array.isArray(data?.message)
    ? data.message.join(", ")
    : data?.message;

  const fallbackMessages: Record<number, string> = {
    400: "Yêu cầu không hợp lệ",
    401: "Phiên đăng nhập không hợp lệ",
    403: "Bạn không có quyền truy cập",
    404: "Không tìm thấy dữ liệu",
    409: "Dữ liệu bị xung đột",
    422: "Dữ liệu không hợp lệ",
    429: "Bạn thao tác quá nhanh",
    500: "Máy chủ đang gặp sự cố",
    503: "Dịch vụ tạm thời không khả dụng",
  };

  return new ApiError(
    message ||
      fallbackMessages[status] ||
      `HTTP Error ${status}`,
    status,
    data?.code,
    data?.errors,
  );
}
