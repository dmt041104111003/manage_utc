export type ResetPasswordFormErrors = {
  newPassword?: string;
  confirmPassword?: string;
};

export type ValidateResetPasswordFormResult = {
  isValid: boolean;
  errors: ResetPasswordFormErrors & { submitError?: string };
};

export type ResetPasswordApiResponse = {
  code?: string;
  message?: string;
  redirectPath?: string;
};

