"use client";

import type { Detail } from "@/lib/types/admin-quan-ly-tien-do-thuc-tap";
import { degreeLabel, internshipStatusLabel } from "@/lib/constants/admin-quan-ly-tien-do-thuc-tap";
import { supervisorLine } from "@/lib/utils/admin-quan-ly-tien-do-thuc-tap";
import MessagePopup from "../../../components/MessagePopup";
import styles from "../../styles/dashboard.module.css";

type Props = {
  open: boolean;
  item: Detail | null;
  onClose: () => void;
};

export default function AdminTienDoViewPopup(props: Props) {
  const { open, item, onClose } = props;
  if (!open || !item) return null;

  const events: Array<{ label: string; at: string | null }> = [];
  for (const h of item.history) {
    if (!h.at) continue;
    events.push({ label: internshipStatusLabel[h.toStatus] ?? String(h.toStatus), at: h.at });
  }
  if (item.report?.reviewedAt) {
    if (item.report.reviewStatus === "APPROVED") {
      events.push({ label: "Đã duyệt BCTT", at: item.report.reviewedAt });
    } else if (item.report.reviewStatus === "REJECTED") {
      events.push({ label: "GVHD từ chối BCTT", at: item.report.reviewedAt });
    }
  }
  events.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));

  return (
    <MessagePopup
      open
      title="Xem thông tin tiến độ thực tập"
      size="extraWide"
      onClose={onClose}
    >
      <table className={styles.viewModalDetailTable}>
        <tbody>
          <tr>
            <th scope="row">MSV</th>
            <td>{item.student.msv}</td>
          </tr>
          <tr>
            <th scope="row">Họ tên</th>
            <td>{item.student.fullName}</td>
          </tr>
          <tr>
            <th scope="row">Lớp</th>
            <td>{item.student.className}</td>
          </tr>
          <tr>
            <th scope="row">Khoa</th>
            <td>{item.student.faculty}</td>
          </tr>
          <tr>
            <th scope="row">Khóa</th>
            <td>{item.student.cohort}</td>
          </tr>
          <tr>
            <th scope="row">Bậc</th>
            <td>{degreeLabel[item.student.degree]}</td>
          </tr>
          <tr>
            <th scope="row">GVHD - Bậc-SĐT-email</th>
            <td style={{ whiteSpace: "pre-wrap" }}>{supervisorLine(item.supervisor)}</td>
          </tr>
          {item.enterprise ? (
            <tr>
              <th scope="row">Tên DN / Vị trí thực tập</th>
              <td>
                {item.enterprise.companyName} - {item.enterprise.position}
              </td>
            </tr>
          ) : null}
          <tr>
            <th scope="row">Các trạng thái thực tập</th>
            <td>
              <div style={{ display: "grid", gap: 8 }}>
                {events.length ? (
                  events.map((e, i) => (
                    <div key={`${e.label}-${e.at}-${i}`} style={{ fontSize: 13, color: "#111827" }}>
                      <span style={{ fontWeight: 600 }}>{e.label}</span> -{" "}
                      <span style={{ color: "#6b7280" }}>{e.at ? new Date(e.at).toLocaleString("vi-VN") : "—"}</span>
                    </div>
                  ))
                ) : (
                  <span>—</span>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </MessagePopup>
  );
}
