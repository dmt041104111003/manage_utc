import Link from "next/link";
import type { SinhVienTraCuuUngTuyenItem } from "@/lib/types/sinhvien-tra-cuu-ung-tuyen";
import { appliedStatusText, canApplyStatusText, workTypeLabel } from "@/lib/constants/sinhvien-tra-cuu-ung-tuyen";
import { formatDateVi } from "@/lib/utils/sinhvien-tra-cuu-ung-tuyen";
import adminStyles from "../../../admin/styles/dashboard.module.css";
import cardStyles from "../styles.module.css";

type Props = {
  items: SinhVienTraCuuUngTuyenItem[];
  canApply: boolean;
};

export default function TraCuuUngTuyenJobGrid({ items, canApply }: Props) {
  return (
    <div className={cardStyles.cardGrid}>
      {items.map((item) => (
        <article key={item.id} className={cardStyles.jobCard}>
          <Link href={`/sinhvien/tra-cuu-ung-tuyen/${item.id}`} className={cardStyles.titleLink}>
            {item.title}
          </Link>
          <div className={cardStyles.company}>{item.companyName}</div>
          <div className={cardStyles.metaRow}>
            <span>{item.address}</span>
            <span>{workTypeLabel[item.workType]}</span>
          </div>
          <div className={cardStyles.metaRow}>
            <span>Vị trí tuyển dụng: {item.expertise}</span>
            <span>Lương: {item.salary}</span>
          </div>
          <div className={cardStyles.metaRow}>
            <span>Kinh nghiệm: {item.experienceRequirement}</span>
            <span>Hạn tuyển: {formatDateVi(item.deadlineAt)}</span>
          </div>
          <div className={cardStyles.footer}>
            <span className={cardStyles.field}>{item.businessField}</span>
            <Link
              href={`/sinhvien/tra-cuu-ung-tuyen/${item.id}`}
              className={`${adminStyles.btn} ${adminStyles.btnPrimary}`.trim()}
            >
              Xem chi tiết
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
