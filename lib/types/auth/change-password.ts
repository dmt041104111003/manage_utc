export type ChangePasswordFormErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  submitError?: string;
};

export type ValidateChangePasswordFormResult = {
  isValid: boolean;
  errors: ChangePasswordFormErrors;
};

export type ChangePasswordApiResponse = {
  code?: string;
  message?: string;
  redirectPath?: string;
};

export type AuthMeResponse = {
  home?: string;
};

