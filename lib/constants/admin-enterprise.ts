export const ADMIN_ENTERPRISE_MSG = {
  listLoadFail: "Không tải được danh sách.",
  genericError: "Lỗi.",
  detailLoadFail: "Không tải chi tiết.",
  detailLoadError: "Lỗi tải chi tiết.",
  deleteFail: "Xóa thất bại.",
  serverUnreachable: "Không thể kết nối máy chủ.",
  approveFail: "Phê duyệt thất bại.",
  rejectFail: "Từ chối thất bại.",
  rejectReasonRequired: "Nhập ít nhất một dòng lý do (mỗi dòng một lý do)."
} as const;

export function buildDeleteEnterpriseConfirmMessage(name: string, tax: string): string {
  return `Thao tác không thể hoàn tác.\n\nBạn có chắc chắn muốn xóa vĩnh viễn tài khoản doanh nghiệp sau?\n\n• Tên: ${name}\n• MST: ${tax}\n\nNhấn OK để xóa, Cancel để giữ nguyên.`;
}

export function buildApproveEnterpriseConfirmMessage(label: string): string {
  return `Xác nhận phê duyệt ${label}?`;
}

export function buildRejectEnterpriseStartConfirmMessage(label: string): string {
  return `Bạn có chắc chắn từ chối phê duyệt ${label}?`;
}
