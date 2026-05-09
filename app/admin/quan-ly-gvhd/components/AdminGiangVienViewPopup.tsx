"use client";

import type { SupervisorListItem } from "@/lib/types/admin-quan-ly-gvhd";
import {
  ADMIN_QUAN_LY_GVHD_DEGREE_LABEL,
  ADMIN_QUAN_LY_GVHD_GENDER_LABEL
} from "@/lib/constants/admin-quan-ly-gvhd";
import { toBirthDateInputValue } from "@/lib/utils/admin-quan-ly-gvhd-dates";

import MessagePopup from "../../../components/MessagePopup";
import styles from "../../styles/dashboard.module.css";

type Props = {
  open: boolean;
  item: SupervisorListItem | null;
  onClose: () => void;
};

export default function AdminGiangVienViewPopup(props: Props) {
  const { open, item, onClose } = props;
  if (!open || !item) return null;

  return (
    <MessagePopup open title="Xem thông tin GVHD" size="extraWide" onClose={onClose}>
      <table className={styles.viewModalDetailTable}>
        <tbody>
          <tr>
            <th scope="row">Họ tên</th>
            <td>{item.fullName}</td>
          </tr>
          <tr>
            <th scope="row">Số điện thoại</th>
            <td>{item.phone ?? "—"}</td>
          </tr>
          <tr>
            <th scope="row">Email</th>
            <td>{item.email}</td>
          </tr>
          <tr>
            <th scope="row">Ngày sinh</th>
            <td>{item.birthDate ? toBirthDateInputValue(item.birthDate) : "—"}</td>
          </tr>
          <tr>
            <th scope="row">Giới tính</th>
            <td>{ADMIN_QUAN_LY_GVHD_GENDER_LABEL[item.gender]}</td>
          </tr>
          <tr>
            <th scope="row">Địa chỉ thường trú</th>
            <td>{[item.permanentProvinceName, item.permanentWardName].filter(Boolean).join(" - ") || "—"}</td>
          </tr>
          <tr>
            <th scope="row">Khoa</th>
            <td>{item.faculty}</td>
          </tr>
          <tr>
            <th scope="row">Bậc</th>
            <td>{ADMIN_QUAN_LY_GVHD_DEGREE_LABEL[item.degree]}</td>
          </tr>
        </tbody>
      </table>
    </MessagePopup>
  );
}

