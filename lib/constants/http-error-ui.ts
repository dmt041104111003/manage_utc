/** Copy mặc định cho giao diện lỗi HTTP (tiếng Việt) */

export type HttpErrorUiCopy = {
  title: string;
  hint: string;
};

export function getHttpErrorUiCopy(status: number): HttpErrorUiCopy {
  switch (status) {
    case 400:
      return {
        title: "Yêu cầu không hợp lệ",
        hint: "Dữ liệu gửi lên không đúng định dạng hoặc thiếu thông tin. Vui lòng kiểm tra và thử lại."
      };
    case 401:
      return {
        title: "Cần đăng nhập",
        hint: "Phiên làm việc có thể đã hết hạn. Đăng nhập lại để tiếp tục."
      };
    case 403:
      return {
        title: "Không có quyền truy cập",
        hint: "Tài khoản của bạn không được phép thực hiện thao tác này."
      };
    case 404:
      return {
        title: "Nội dung không tồn tại",
        hint: "Đường dẫn hoặc mục bạn tìm không có trên hệ thống, hoặc đã bị gỡ."
      };
    case 408:
      return {
        title: "Hết thời gian chờ",
        hint: "Máy chủ phản hồi quá lâu. Thử lại sau vài giây."
      };
    case 409:
      return {
        title: "Xung đột dữ liệu",
        hint: "Thao tác không thể thực hiện vì trạng thái dữ liệu đã thay đổi. Tải lại trang và thử lại."
      };
    case 422:
      return {
        title: "Không thể xử lý nội dung",
        hint: "Dữ liệu hợp lệ về mặt cú pháp nhưng không đạt yêu cầu nghiệp vụ. Kiểm tra thông tin đã nhập."
      };
    case 429:
      return {
        title: "Quá nhiều yêu cầu",
        hint: "Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Chờ một lúc rồi thử lại."
      };
    case 502:
      return {
        title: "Cổng nối không phản hồi",
        hint: "Máy chủ trung gian nhận phản hồi không hợp lệ từ máy chủ gốc. Thử lại sau."
      };
    case 503:
      return {
        title: "Dịch vụ tạm ngưng",
        hint: "Hệ thống đang bảo trì hoặc quá tải. Vui lòng quay lại sau ít phút."
      };
    case 504:
      return {
        title: "Hết thời gian chờ phía máy chủ",
        hint: "Máy chủ phụ không phản hồi kịp. Thử lại sau."
      };
    case 500:
    default:
      return {
        title: "Lỗi máy chủ",
        hint:
          status === 500
            ? "Máy chủ đang không hoạt động đúng hoặc gặp sự cố tạm thời. Vui lòng thử lại sau."
            : "Đã xảy ra lỗi khi xử lý yêu cầu. Nếu lỗi lặp lại, hãy báo cho quản trị viên kèm mã lỗi (nếu có)."
      };
  }
}
