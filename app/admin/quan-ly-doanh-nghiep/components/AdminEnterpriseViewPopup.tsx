"use client";

import type { AdminEnterpriseDetail } from "@/lib/types/admin";
import { EnterpriseViewDetailTable } from "../../components/EnterpriseViewDetailTable";
import MessagePopup from "../../../components/MessagePopup";

import styles from "../../styles/dashboard.module.css";
import { ChartStyleLoading } from "@/app/components/ChartStyleLoading";

type Props = {
  viewLoading: boolean;
  viewDetail: AdminEnterpriseDetail | null;
  onClose: () => void;
};

export default function AdminEnterpriseViewPopup(props: Props) {
  const { viewLoading, viewDetail, onClose } = props;

  if (!viewLoading && !viewDetail) return null;

  return (
    <MessagePopup open title="Xem thông tin doanh nghiệp" size="extraWide">
      {viewLoading ? <ChartStyleLoading variant="compact" /> : null}
      {!viewLoading && viewDetail ? <EnterpriseViewDetailTable item={viewDetail} /> : null}
      <div className={styles.modalActions}>
        <button type="button" className={styles.btn} onClick={onClose}>
          Đóng
        </button>
      </div>
    </MessagePopup>
  );
}

