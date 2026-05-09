"use client";

import { useState } from "react";
import type { AssignmentItem } from "@/lib/types/admin-phan-cong-gvhd";
import { ADMIN_PHAN_CONG_GVHD_STATUS_LABEL } from "@/lib/constants/admin-phan-cong-gvhd";
import { studentDisplay, supervisorDisplay } from "@/lib/utils/admin-phan-cong-gvhd-display";

import MessagePopup from "../../../components/MessagePopup";

import styles from "../../styles/dashboard.module.css";

type Props = {
  viewTarget: AssignmentItem | null;
  onClose: () => void;
};

export default function AdminPhanCongGVHDViewPopup(props: Props) {
  const { viewTarget, onClose } = props;
  const [showAllStudents, setShowAllStudents] = useState(false);

  if (!viewTarget) return null;
  const students = Array.isArray(viewTarget.students) && viewTarget.students.length
    ? viewTarget.students
    : viewTarget.student?.msv
      ? [viewTarget.student]
      : [];
  const visibleStudents = showAllStudents ? students : students.slice(0, 1);

  return (
    <MessagePopup
      open
      title="Xem phân công"
      size="extraWide"
      onClose={onClose}
      actions={
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onClose}>
          Đóng
        </button>
      }
    >
      <table className={styles.viewModalDetailTable}>
        <tbody>
          <tr>
            <th scope="row">Khoa</th>
            <td>{viewTarget.faculty}</td>
          </tr>
          <tr>
            <th scope="row">Đợt thực tập</th>
            <td>{viewTarget.batch?.name || "—"}</td>
          </tr>
          <tr>
            <th scope="row">Giảng viên hướng dẫn</th>
            <td>{supervisorDisplay(viewTarget.supervisor as any) || "—"}</td>
          </tr>
          <tr>
            <th scope="row">Trạng thái hướng dẫn</th>
            <td>{ADMIN_PHAN_CONG_GVHD_STATUS_LABEL[viewTarget.status]}</td>
          </tr>
          <tr>
            <th scope="row">SV hướng dẫn</th>
            <td>
              {students.length ? (
                <div style={{ display: "grid", gap: 4 }}>
                  {visibleStudents.map((s) => (
                    <span key={String(s.id || `${s.msv}-${s.fullName}`)}>{studentDisplay(s as any)}</span>
                  ))}
                  {students.length > 1 ? (
                    <button
                      type="button"
                      className={styles.textLinkBtn}
                      onClick={() => setShowAllStudents((v) => !v)}
                    >
                      {showAllStudents ? "Thu gọn" : `Xem thêm (${students.length - 1})`}
                    </button>
                  ) : null}
                </div>
              ) : (
                "—"
              )}
            </td>
          </tr>
          <tr>
            <th scope="row">Ghi chú</th>
            <td style={{ color: "#667085" }}>
              Trạng thái thực tập của sinh viên xem chi tiết trong module Quản lý sinh viên.
            </td>
          </tr>
        </tbody>
      </table>
    </MessagePopup>
  );
}

