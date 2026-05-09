"use client";

import type { ReactNode } from "react";
import adminStyles from "../admin/styles/dashboard.module.css";
import type { PopupSize } from "./MessagePopup";
import MessagePopup from "./MessagePopup";

export default function FormPopup({
  open,
  title,
  busy,
  size = "wide",
  children,
  actions,
  onClose
}: {
  open: boolean;
  title: string;
  busy: boolean;
  size?: PopupSize;
  children: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
}) {
  return (
    <MessagePopup
      open={open}
      title={title}
      size={size}
      onClose={onClose}
      actions={
        actions ?? (
          <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
            <button type="button" className={adminStyles.btn} onClick={onClose} disabled={busy}>
              Đóng
            </button>
          </div>
        )
      }
    >
      <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
        {children}
      </fieldset>
    </MessagePopup>
  );
}

