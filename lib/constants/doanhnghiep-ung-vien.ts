import type { JobStatus } from "@/lib/types/doanhnghiep-ung-vien";

export const DOANHNGHIEP_UNG_VIEN_ENDPOINT = "/api/doanhnghiep/ung-vien";

export const DOANHNGHIEP_UNG_VIEN_PAGE_SIZE = 10;

export const DOANHNGHIEP_UNG_VIEN_STATUS_LABEL: Record<JobStatus, string> = {
  PENDING: "Chờ duyệt",
  REJECTED: "Từ chối",
  ACTIVE: "Đang tuyển",
  STOPPED: "Dừng tuyển"
};

export const DOANHNGHIEP_UNG_VIEN_ERROR_DEFAULT = "Không thể tải danh sách tin tuyển dụng.";

