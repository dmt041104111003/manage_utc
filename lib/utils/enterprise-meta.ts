export function metaRecord(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  return meta as Record<string, unknown>;
}

/** Bỏ base64 nặng khỏi enterpriseMeta khi trả API admin (danh sách / chi tiết). */
export function stripHeavyEnterpriseMeta(meta: unknown): unknown {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return meta;
  const m = { ...(meta as Record<string, unknown>) };
  delete m.businessLicenseBase64;
  delete m.companyLogoBase64;
  return m;
}

/** Một dòng tóm tắt địa chỉ / lĩnh vực cho bảng danh sách. */
export function formatEnterpriseMetaSummary(meta: unknown): string {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return "—";
  const m = meta as Record<string, unknown>;
  const fields = m.businessFields;
  const parts: string[] = [];
  if (typeof m.province === "string") parts.push(m.province);
  if (typeof m.ward === "string") parts.push(m.ward);
  if (Array.isArray(fields) && fields.length) parts.push(String(fields.join(", ")));
  return parts.length ? parts.join(" · ") : "—";
}

export type EnterpriseMetaDetailRow = { label: string; value: string };

/** Các trường hiển thị trên trang chi tiết hồ sơ DN (không có nội dung file). */
export function buildEnterpriseMetaDetailRows(meta: unknown): EnterpriseMetaDetailRow[] {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return [];
  const m = meta as Record<string, unknown>;
  const out: EnterpriseMetaDetailRow[] = [];

  const push = (label: string, v: unknown) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) {
      if (v.length) out.push({ label, value: v.map(String).join(", ") });
      return;
    }
    out.push({ label, value: String(v) });
  };

  push("Lĩnh vực hoạt động", m.businessFields);
  push("Tỉnh / Thành phố", m.province);
  push("Phường / Xã", m.ward);
  push("Mã tỉnh", m.provinceCode);
  push("Mã phường", m.wardCode);
  push("Địa chỉ chi tiết", m.addressDetail);
  push("Tên file giấy phép KD", m.businessLicenseName);
  push("Loại file giấy phép", m.businessLicenseMime);
  push("Tên file logo", m.companyLogoName);
  push("Loại file logo", m.companyLogoMime);
  push("Website", m.website);

  return out;
}
