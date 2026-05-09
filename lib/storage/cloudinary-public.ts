/**
 * URL + ref helpers dùng được trên client (không import package `cloudinary` → tránh `fs` trong bundle).
 */

export const CLOUDINARY_REF_PREFIX = "cloudinary:";

function rawDeliveryCloudName(): string | null {
  const srv = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  if (srv) return srv;
  return String(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "").trim() || null;
}

function imageDeliveryCloudName(): string | null {
  const pub = String(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "").trim();
  if (pub) return pub;
  return String(process.env.CLOUDINARY_CLOUD_NAME || "").trim() || null;
}

export function buildCloudinaryRawDeliveryUrl(publicId: string): string | null {
  const cloudName = rawDeliveryCloudName();
  if (!cloudName) return null;
  const pid = String(publicId || "").replace(/^\/+/, "");
  const encodedPid = pid
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/raw/upload/${encodedPid}`;
}

export function buildCloudinaryImageDeliveryUrl(publicId: string): string | null {
  const cloudName = imageDeliveryCloudName();
  if (!cloudName) return null;
  const pid = String(publicId || "").replace(/^\/+/, "");
  const encodedPid = pid
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/${encodedPid}`;
}

export function toCloudinaryRef(publicId: string): string {
  return `${CLOUDINARY_REF_PREFIX}${publicId}`;
}

export function fromCloudinaryRef(value: string | null | undefined): string | null {
  const raw = String(value || "").trim();
  if (!raw.startsWith(CLOUDINARY_REF_PREFIX)) return null;
  const pid = raw.slice(CLOUDINARY_REF_PREFIX.length).trim();
  return pid || null;
}

/** public_id từ DB: `cloudinary:...` hoặc legacy chỉ path `enterprise_licenses/...`. */
export function enterpriseLicensePublicIdFromStored(value: string | null | undefined): string | null {
  const prefixed = fromCloudinaryRef(value);
  if (prefixed) return prefixed;
  const t = String(value || "").trim();
  if (!t || t.includes("..") || t.includes("://") || t.startsWith("{")) return null;
  if (t.startsWith("enterprise_licenses/") && t.length <= 500) return t;
  return null;
}
