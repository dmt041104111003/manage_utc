export type Role = "sinhvien" | "doanhnghiep" | "giangvien";
export type AccountStatus = "ACTIVE" | "STOPPED";

export type AccountRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  status: AccountStatus;
};

