export type LoginFormErrors = {
  identifier?: string;
  password?: string;
};

export type ValidateLoginFormResult = {
  isValid: boolean;
  errors: LoginFormErrors;
};

export type LoginApiResponse = {
  code?: string;
  message?: string;
  redirectPath?: string;
};

