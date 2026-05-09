 "use client";

import type { AdminEnterpriseDetail } from "@/lib/types/admin";
import { metaRecord } from "@/lib/utils/enterprise-meta";
import {
  buildEnterpriseHeadquartersAddress,
  dataUrlFromBase64,
  formatBusinessFields
} from "@/lib/utils/enterprise-admin-display";
import { formatAdminEnterpriseStatusLine } from "@/lib/utils/admin-enterprise-display";
import { resolveRepresentativeTitle } from "@/lib/utils/enterprise-representative";
import {
  buildCloudinaryImageDeliveryUrl,
  enterpriseLicensePublicIdFromStored,
  fromCloudinaryRef
} from "@/lib/storage/cloudinary-public";
import styles from "../styles/dashboard.module.css";

type Props = { item: AdminEnterpriseDetail };

export function EnterpriseViewDetailTable({ item }: Props) {
  const m = metaRecord(item.enterpriseMeta);
  const fields = formatBusinessFields(item.enterpriseMeta);
  const address = buildEnterpriseHeadquartersAddress(item.enterpriseMeta);
  const repName = typeof m.representativeName === "string" ? m.representativeName : item.fullName;
  const titleDisplay = resolveRepresentativeTitle(item.representativeTitle, item.enterpriseMeta);
  const licName = typeof m.businessLicenseName === "string" ? m.businessLicenseName : "—";
  const licB64 = typeof m.businessLicenseBase64 === "string" ? m.businessLicenseBase64 : null;
  const logoMime = typeof m.companyLogoMime === "string" ? m.companyLogoMime : "";
  const logoB64 = typeof m.companyLogoBase64 === "string" ? m.companyLogoBase64 : null;
  const website = typeof m.website === "string" && m.website ? m.website : null;

  const licPublicId = enterpriseLicensePublicIdFromStored(
    typeof m.businessLicensePublicId === "string" ? m.businessLicensePublicId : null
  );
  const logoPublicId = fromCloudinaryRef(typeof m.companyLogoPublicId === "string" ? m.companyLogoPublicId : null);
  const licHref =
    licPublicId || licB64 ? `/api/files/enterprise-business-license/${item.id}` : null;
  const logoFromCloud = logoPublicId ? buildCloudinaryImageDeliveryUrl(logoPublicId) : null;
  const logoSrc =
    logoFromCloud ??
    (logoB64 && logoMime.startsWith("image/") ? dataUrlFromBase64(logoMime, logoB64) : null);

  const statusLine = formatAdminEnterpriseStatusLine(item.enterpriseStatus);

  return (
    <div className={styles.viewModalDetailTableWrap}>
      <table className={styles.viewModalDetailTable}>
        <thead>
          <tr>
            <th scope="col">Trường thông tin</th>
            <th scope="col">Nội dung</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Tên doanh nghiệp</th>
            <td>{item.companyName || "—"}</td>
          </tr>
          <tr>
            <th scope="row">Mã số thuế</th>
            <td>{item.taxCode || "—"}</td>
          </tr>
          <tr>
            <th scope="row">Lĩnh vực hoạt động</th>
            <td>{fields}</td>
          </tr>
          <tr>
            <th scope="row">Địa chỉ trụ sở chính</th>
            <td>{address}</td>
          </tr>
          <tr>
            <th scope="row">File giấy phép kinh doanh</th>
            <td>
              {licHref ? (
                <a className={styles.detailLink} href={licHref} target="_blank" rel="noreferrer">
                  {licName}
                </a>
              ) : (
                licName
              )}
            </td>
          </tr>
          <tr>
            <th scope="row">Image logo</th>
            <td>{logoSrc ? <img className={styles.previewLogo} src={logoSrc} alt="Logo công ty" /> : "—"}</td>
          </tr>
          <tr>
            <th scope="row">Website</th>
            <td>
              {website ? (
                <a href={website} target="_blank" rel="noopener noreferrer">
                  {website}
                </a>
              ) : (
                "—"
              )}
            </td>
          </tr>
          <tr>
            <th scope="row">Người đại diện</th>
            <td>{repName || "—"}</td>
          </tr>
          <tr>
            <th scope="row">Chức vụ</th>
            <td>{titleDisplay}</td>
          </tr>
          <tr>
            <th scope="row">Số điện thoại</th>
            <td>{item.phone || "—"}</td>
          </tr>
          <tr>
            <th scope="row">Email</th>
            <td>{item.email}</td>
          </tr>
          <tr>
            <th scope="row">Trạng thái phê duyệt</th>
            <td>{statusLine}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
