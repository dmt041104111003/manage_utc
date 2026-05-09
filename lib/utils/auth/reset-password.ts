import type {
  ResetPasswordApiResponse,
  ValidateResetPasswordFormResult
} from "@/lib/types/auth/reset-password";
import {
  RESET_PASSWORD_ERROR_CONFIRM_EMPTY,
  RESET_PASSWORD_ERROR_CONFIRM_MISMATCH,
  RESET_PASSWORD_ERROR_MISSING_TOKEN,
  RESET_PASSWORD_ERROR_NEW_PASSWORD_EMPTY,
  RESET_PASSWORD_ERROR_PASSWORD_WEAK,
  RESET_PASSWORD_NETWORK_ERROR,
  RESET_PASSWORD_PASSWORD_REGEX,
  RESET_PASSWORD_SUBMIT_ERROR_DEFAULT,
  RESET_PASSWORD_SUCCESS_DEFAULT
} from "@/lib/constants/auth/reset-password";

export function validateResetPasswordForm(args: {
  newPassword: string;
  confirmPassword: string;
  resetToken: string;
}): ValidateResetPasswordFormResult {
  const { newPassword, confirmPassword, resetToken } = args;

  const errors: ValidateResetPasswordFormResult["errors"] = {};

  if (!newPassword.trim()) {
    errors.newPassword = RESET_PASSWORD_ERROR_NEW_PASSWORD_EMPTY;
  } else if (!RESET_PASSWORD_PASSWORD_REGEX.test(newPassword)) {
    errors.newPassword = RESET_PASSWORD_ERROR_PASSWORD_WEAK;
  }

  if (!confirmPassword.trim()) {
    errors.confirmPassword = RESET_PASSWORD_ERROR_CONFIRM_EMPTY;
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = RESET_PASSWORD_ERROR_CONFIRM_MISMATCH;
  }

  if (!resetToken.trim()) {
    errors.submitError = RESET_PASSWORD_ERROR_MISSING_TOKEN;
  }

  const isValid =
    !errors.newPassword && !errors.confirmPassword && !errors.submitError;

  return { isValid, errors };
}

export function mapResetPasswordApiError(args: {
  code?: string;
  message?: string;
}): { newPasswordError?: string; confirmPasswordError?: string; submitError?: string } {
  const { code, message } = args;

  if (code === "WEAK_PASSWORD") return { newPasswordError: message || "" };
  if (code === "CONFIRM_NOT_MATCH") return { confirmPasswordError: message || "" };

  return { submitError: message || RESET_PASSWORD_SUBMIT_ERROR_DEFAULT };
}

export function getResetPasswordSuccessMessage(args: { responseMessage?: string }): string {
  return args.responseMessage || RESET_PASSWORD_SUCCESS_DEFAULT;
}

export function getResetPasswordSubmitErrorMessage(): string {
  return RESET_PASSWORD_NETWORK_ERROR;
}

export function getResetPasswordRedirectPath(args: { redirectPath?: string }): string {
  return args.redirectPath || "/auth/dangnhap";
}

export function normalizeResetPasswordApiResponse(data: ResetPasswordApiResponse | unknown): {
  code?: string;
  message?: string;
  redirectPath?: string;
} {
  const d = data as ResetPasswordApiResponse;
  if (!d || typeof d !== "object") return {};
  return { code: d.code, message: d.message, redirectPath: d.redirectPath };
}

