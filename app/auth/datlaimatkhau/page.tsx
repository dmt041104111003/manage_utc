"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import {
  getResetPasswordRedirectPath,
  getResetPasswordSubmitErrorMessage,
  getResetPasswordSuccessMessage,
  mapResetPasswordApiError,
  validateResetPasswordForm
} from "@/lib/utils/auth/reset-password";
import ResetPasswordFormCard, { ResetPasswordFallback } from "./components/ResetPasswordFormCard";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const resetToken = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNewPasswordError("");
    setConfirmPasswordError("");
    setSubmitError("");
    setSuccessMessage("");

    const validation = validateResetPasswordForm({ newPassword, confirmPassword, resetToken });
    if (!validation.isValid) {
      if (validation.errors.newPassword) setNewPasswordError(validation.errors.newPassword);
      if (validation.errors.confirmPassword) setConfirmPasswordError(validation.errors.confirmPassword);
      if (validation.errors.submitError) setSubmitError(validation.errors.submitError);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token: resetToken,
          newPassword,
          confirmPassword
        })
      });
      const data = await response.json();
      if (!response.ok) {
        const mapped = mapResetPasswordApiError({ code: data.code, message: data.message });
        if (mapped.newPasswordError !== undefined) setNewPasswordError(mapped.newPasswordError);
        if (mapped.confirmPasswordError !== undefined) setConfirmPasswordError(mapped.confirmPasswordError);
        if (mapped.submitError !== undefined) setSubmitError(mapped.submitError);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(getResetPasswordSuccessMessage({ responseMessage: data.message }));
      setIsSubmitting(false);
      setTimeout(() => {
        router.replace(getResetPasswordRedirectPath({ redirectPath: data.redirectPath }));
      }, 1200);
    } catch {
      setSubmitError(getResetPasswordSubmitErrorMessage());
      setIsSubmitting(false);
    }
  };

  return (
    <ResetPasswordFormCard
      email={email}
      newPassword={newPassword}
      confirmPassword={confirmPassword}
      newPasswordError={newPasswordError}
      confirmPasswordError={confirmPasswordError}
      submitError={submitError}
      successMessage={successMessage}
      isSubmitting={isSubmitting}
      onNewPasswordChange={setNewPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onSubmit={handleSubmit}
    />
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
