"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  getChangePasswordNetworkErrorMessage,
  getChangePasswordSuccessMessage,
  mapChangePasswordApiError,
  normalizeAuthMeResponse,
  validateChangePasswordForm
} from "@/lib/utils/auth/change-password";
import ChangePasswordFormCard from "./components/ChangePasswordFormCard";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dashboardHome, setDashboardHome] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = await res.json();
        const normalized = normalizeAuthMeResponse(data);
        if (normalized.home) setDashboardHome(normalized.home);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPasswordError("");
    setNewPasswordError("");
    setConfirmPasswordError("");
    setSubmitError("");
    setSuccessMessage("");

    const validation = validateChangePasswordForm({ currentPassword, newPassword, confirmPassword });
    if (!validation.isValid) {
      if (validation.errors.currentPassword) setCurrentPasswordError(validation.errors.currentPassword);
      if (validation.errors.newPassword) setNewPasswordError(validation.errors.newPassword);
      if (validation.errors.confirmPassword) setConfirmPasswordError(validation.errors.confirmPassword);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      });
      const data = await response.json();

      if (!response.ok) {
        const mapped = mapChangePasswordApiError({ code: data.code, message: data.message });
        if (mapped.currentPassword) setCurrentPasswordError(mapped.currentPassword);
        if (mapped.newPassword) setNewPasswordError(mapped.newPassword);
        if (mapped.confirmPassword) setConfirmPasswordError(mapped.confirmPassword);
        if (mapped.submitError) setSubmitError(mapped.submitError);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(getChangePasswordSuccessMessage({ responseMessage: data.message }));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsSubmitting(false);
    } catch {
      setSubmitError(getChangePasswordNetworkErrorMessage());
      setIsSubmitting(false);
    }
  };

  return (
    <ChangePasswordFormCard
      currentPassword={currentPassword}
      newPassword={newPassword}
      confirmPassword={confirmPassword}
      currentPasswordError={currentPasswordError}
      newPasswordError={newPasswordError}
      confirmPasswordError={confirmPasswordError}
      submitError={submitError}
      successMessage={successMessage}
      isSubmitting={isSubmitting}
      dashboardHome={dashboardHome}
      onCurrentPasswordChange={setCurrentPassword}
      onNewPasswordChange={setNewPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onSubmit={handleSubmit}
    />
  );
}
