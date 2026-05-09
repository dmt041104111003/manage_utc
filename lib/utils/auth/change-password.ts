import type {
  AuthMeResponse,
  ChangePasswordApiResponse,
  ChangePasswordFormErrors,
  ValidateChangePasswordFormResult
} from "@/lib/types/auth/change-password";
import {
  CHANGE_PASSWORD_ERROR_CONFIRM_EMPTY,
  CHANGE_PASSWORD_ERROR_CONFIRM_MISMATCH,
  CHANGE_PASSWORD_ERROR_CURRENT_EMPTY,
  CHANGE_PASSWORD_ERROR_NEW_EMPTY,
  CHANGE_PASSWORD_ERROR_NEW_SAME_AS_CURRENT,
  CHANGE_PASSWORD_ERROR_NETWORK,
  CHANGE_PASSWORD_ERROR_SUBMIT_DEFAULT,
  CHANGE_PASSWORD_ERROR_SUBMIT_UNAUTHORIZED,
  CHANGE_PASSWORD_ERROR_WEAK,
  CHANGE_PASSWORD_SUCCESS_DEFAULT
} from "@/lib/constants/auth/change-password";
import { AUTH_STRONG_PASSWORD_PATTERN } from "@/lib/constants/auth/patterns";

export function validateChangePasswordForm(args: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): ValidateChangePasswordFormResult {
  const { currentPassword, newPassword, confirmPassword } = args;

  const errors: ChangePasswordFormErrors = {};

  if (!currentPassword.trim()) {
    errors.currentPassword = CHANGE_PASSWORD_ERROR_CURRENT_EMPTY;
  }

  if (!newPassword.trim()) {
    errors.newPassword = CHANGE_PASSWORD_ERROR_NEW_EMPTY;
  } else if (newPassword === currentPassword) {
    errors.newPassword = CHANGE_PASSWORD_ERROR_NEW_SAME_AS_CURRENT;
  } else if (!AUTH_STRONG_PASSWORD_PATTERN.test(newPassword)) {
    errors.newPassword = CHANGE_PASSWORD_ERROR_WEAK;
  }

  if (!confirmPassword.trim()) {
    errors.confirmPassword = CHANGE_PASSWORD_ERROR_CONFIRM_EMPTY;
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = CHANGE_PASSWORD_ERROR_CONFIRM_MISMATCH;
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
}

export function mapChangePasswordApiError(args: {
  code?: string;
  message?: string;
}): ChangePasswordFormErrors {
  const { code, message } = args;

  if (code === "UNAUTHORIZED")
    return { submitError: message || CHANGE_PASSWORD_ERROR_SUBMIT_UNAUTHORIZED };

  // Keep mapping aligned with existing backend error codes.
  if (code === "WRONG_CURRENT") return { currentPassword: message };
  if (code === "SAME_AS_CURRENT" || code === "WEAK_PASSWORD") return { newPassword: message };
  if (code === "CONFIRM_NOT_MATCH") return { confirmPassword: message };

  return { submitError: message || CHANGE_PASSWORD_ERROR_SUBMIT_DEFAULT };
}

export function getChangePasswordSuccessMessage(args: { responseMessage?: string }): string {
  return args.responseMessage || CHANGE_PASSWORD_SUCCESS_DEFAULT;
}

export function getChangePasswordNetworkErrorMessage(): string {
  return CHANGE_PASSWORD_ERROR_NETWORK;
}

export function normalizeAuthMeResponse(data: unknown): AuthMeResponse {
  const d = data as AuthMeResponse;
  if (!d || typeof d !== "object") return {};
  return { home: typeof d.home === "string" ? d.home : undefined };
}

