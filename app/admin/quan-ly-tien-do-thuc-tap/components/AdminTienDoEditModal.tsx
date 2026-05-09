"use client";

import type { Detail } from "@/lib/types/admin-quan-ly-tien-do-thuc-tap";
import { degreeLabel } from "@/lib/constants/admin-quan-ly-tien-do-thuc-tap";
import { supervisorLine } from "@/lib/utils/admin-quan-ly-tien-do-thuc-tap";
import FormPopup from "../../../components/FormPopup";
import styles from "../../styles/dashboard.module.css";
import formStyles from "../../../auth/styles/register.module.css";

type Props = {
  open: boolean;
  item: Detail | null;
  finalStatusDraft: "COMPLETED" | "REJECTED";
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChangeFinalStatus: (v: "COMPLETED" | "REJECTED") => void;
};

export default function AdminTienDoEditModal(props: Props) {
  const { open, item, finalStatusDraft, busy, onClose, onSubmit, onChangeFinalStatus } = props;
  if (!open || !item) return null;

  return (
    <FormPopup
      open
      title="Cập nhật trạng thái thực tập cuối cùng"
      size="wide"
      busy={busy}
      onClose={onClose}
      actions={
        <>
          <button type="button" className={styles.btn} disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy} onClick={onSubmit}>
            Lưu
          </button>
        </>
      }
    >
      <div style={{ display: "grid", gap: 14 }}>
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
              <th scope="row">GVHD-Bậc-SĐT-Email</th>
              <td style={{ whiteSpace: "pre-wrap" }}>{supervisorLine(item.supervisor)}</td>
            </tr>
            <tr>
              <th scope="row">File BCTT</th>
              <td>
                {item.report?.reportUrl ? (
                  <a className={styles.detailLink} href={item.report.reportUrl} download={item.report.reportFileName}>
                    Tải BCTT
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
            <tr>
              <th scope="row">Điểm/đánh giá GVHD</th>
              <td>
                {item.report?.supervisorPoint ?? "—"} - {item.report?.supervisorEvaluation ?? "—"}
              </td>
            </tr>
            <tr>
              <th scope="row">Điểm/đánh giá DN</th>
              <td>
                {item.enterprise
                  ? `${item.report?.enterprisePoint ?? "—"} - ${item.report?.enterpriseEvaluation ?? "—"}`
                  : "—"}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Trạng thái</div>
          <select
            className={styles.selectInput}
            value={finalStatusDraft}
            onChange={(e) => onChangeFinalStatus(e.target.value as "COMPLETED" | "REJECTED")}
            disabled={busy}
          >
            <option value="COMPLETED">Hoàn thành thực tập</option>
            <option value="REJECTED">Từ chối</option>
          </select>
          <p className={formStyles.hint}>
            Chỉ cho phép cập nhật khi sinh viên ở trạng thái <b>Đã duyệt BCTT</b>.
          </p>
        </div>
      </div>
    </FormPopup>
  );
}
