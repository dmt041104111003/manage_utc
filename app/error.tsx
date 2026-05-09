"use client";

import { useEffect } from "react";
import { HttpErrorView } from "@/app/components/HttpErrorView";

type AppError = Error & { digest?: string; status?: number };

export default function AppError({ error, reset }: { error: AppError; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const status =
    typeof error.status === "number" && error.status >= 400 && error.status < 600 ? error.status : 500;

  return (
    <HttpErrorView
      status={status}
      technicalDetail={error.message}
      digest={error.digest}
      onRetry={reset}
    />
  );
}
