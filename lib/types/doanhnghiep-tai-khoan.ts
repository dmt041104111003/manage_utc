export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  item?: T;
};

export type EnterpriseAccountFormState = {
  email: string;
  phone: string;
  representativeName: string;
  representativeTitle: string;
  companyIntro: string;
  website: string;
};

