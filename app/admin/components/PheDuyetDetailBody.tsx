import Link from "next/link";
import type { PendingEnterpriseItem } from "@/lib/types/admin";
import { buildEnterpriseMetaDetailRows } from "@/lib/utils/enterprise-meta";
import styles from "../styles/dashboard.module.css";

type Props = {
  item: PendingEnterpriseItem;
};

export function PheDuyetDetailBody({ item }: Props) {
  const meta = buildEnterpriseMetaDetailRows(item.enterpriseMeta);

  return (
    <section className={styles.detailCard}>
      <h2 className={styles.detailSectionTitle}>Thông tin doanh nghiệp & liên hệ</h2>
      <dl className={styles.detailList}>
        <div className={styles.detailListRow}>
          <dt>Tên doanh nghiệp</dt>
          <dd>{item.companyName || "—"}</dd>
        </div>
        <div className={styles.detailListRow}>
          <dt>Mã số thuế</dt>
          <dd>{item.taxCode || "—"}</dd>
        </div>
        <div className={styles.detailListRow}>
          <dt>Email</dt>
          <dd>{item.email}</dd>
        </div>
        <div className={styles.detailListRow}>
          <dt>Điện thoại</dt>
          <dd>{item.phone || "—"}</dd>
        </div>
        <div className={styles.detailListRow}>
          <dt>Người đại diện / liên hệ</dt>
          <dd>{item.fullName}</dd>
        </div>
        <div className={styles.detailListRow}>
          <dt>Ngày gửi đăng ký</dt>
          <dd>{new Date(item.createdAt).toLocaleString("vi-VN")}</dd>
        </div>
      </dl>

      <h2 className={styles.detailSectionTitle}>Hồ sơ đính kèm & địa chỉ</h2>
      <dl className={styles.detailList}>
        {meta.length === 0 ? (
          <div className={styles.detailListRow}>
            <dt>—</dt>
            <dd>Không có dữ liệu bổ sung.</dd>
          </div>
        ) : (
          meta.map((row) => (
            <div key={row.label} className={styles.detailListRow}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))
        )}
      </dl>

      <p className={styles.backToTableBottom}>
        <Link href="/admin/phe-duyet">← Quay lại danh sách phê duyệt</Link>
      </p>
    </section>
  );
}
