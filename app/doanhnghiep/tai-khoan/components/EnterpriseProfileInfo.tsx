import type { AdminEnterpriseDetail } from "@/lib/types/admin";
import adminStyles from "../../../admin/styles/dashboard.module.css";

type Props = {
  me: AdminEnterpriseDetail;
  address: string;
  licName: string;
  licHref: string | null;
  logoSrc: string | null;
  statusText: string;
};

export default function EnterpriseProfileInfo({ me, address, licName, licHref, logoSrc, statusText }: Props) {
  return (
    <table className={adminStyles.viewModalDetailTable} style={{ marginTop: 12 }}>
      <tbody>
        <tr>
          <th scope="row">Tên doanh nghiệp</th>
          <td>{me.companyName || "—"}</td>
        </tr>
        <tr>
          <th scope="row">Mã số thuế</th>
          <td>{me.taxCode || "—"}</td>
        </tr>
        <tr>
          <th scope="row">Địa chỉ trụ sở chính</th>
          <td>{address}</td>
        </tr>
        <tr>
          <th scope="row">File giấy phép kinh doanh</th>
          <td>
            {licHref ? (
              <a className={adminStyles.detailLink} href={licHref} target="_blank" rel="noopener noreferrer">
                {licName}
              </a>
            ) : (
              licName
            )}
          </td>
        </tr>
        <tr>
          <th scope="row">Logo công ty</th>
          <td>{logoSrc ? <img src={logoSrc} alt="Logo công ty" className={adminStyles.previewLogo} /> : "—"}</td>
        </tr>
        <tr>
          <th scope="row">Email</th>
          <td>{me.email}</td>
        </tr>
        <tr>
          <th scope="row">Số điện thoại</th>
          <td>{me.phone || "—"}</td>
        </tr>
        <tr>
          <th scope="row">Trạng thái phê duyệt</th>
          <td>{statusText}</td>
        </tr>
      </tbody>
    </table>
  );
}
