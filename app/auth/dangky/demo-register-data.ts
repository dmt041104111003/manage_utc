
export type EnterpriseRegisterPrefill = {
  companyName: string;
  taxCode: string;
  businessFields: string[];
  provinceCode: string;
  wardCode: string;
  provinceName: string;
  wardName: string;
  addressDetail: string;
  website: string;
  representativeName: string;
  representativeTitle: string;
  phone: string;
  email: string;
};

export const DEMO_ENTERPRISE_REGISTER_FORM: EnterpriseRegisterPrefill = {
  companyName: "Công ty TNHH Demo UTC Thực Tập",
  taxCode: "0123456789",
  businessFields: ["Công nghệ thông tin"],
  provinceCode: "1",
  wardCode: "157",
  provinceName: "Thành phố Hà Nội",
  wardName: "Phường Nghĩa Đô",
  addressDetail: "Tòa nhà A số 1 phố Demo Yên Hòa",
  website: "https://demo-utc.example.com",
  representativeName: "Nguyễn Văn Demo",
  representativeTitle: "Giám đốc",
  phone: "0912345678",
  email: "demo.doanhnghiep@example.com"
};
