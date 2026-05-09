export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  item?: T;
};

export type EnterpriseAccountFormState = {
  representativeName: string;
  representativeTitle: string;
  companyIntro: string;
  website: string;
};

