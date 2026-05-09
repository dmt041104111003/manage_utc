import crypto from "crypto";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import {
  buildCloudinaryImageDeliveryUrl,
  buildCloudinaryRawDeliveryUrl
} from "./cloudinary-public";

export type CloudinaryUploadResult = {
  publicId: string;
};

export {
  CLOUDINARY_REF_PREFIX,
  buildCloudinaryImageDeliveryUrl,
  buildCloudinaryRawDeliveryUrl,
  enterpriseLicensePublicIdFromStored,
  fromCloudinaryRef,
  toCloudinaryRef
} from "./cloudinary-public";

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function sanitizeSegment(s: string): string {
  return String(s || "")
    .replace(/[^\w.\-() ]+/g, "")
    .trim()
    .slice(0, 120);
}

function removeExtension(filename: string): string {
  const parsed = path.parse(filename);
  return parsed.name || filename;
}

export function buildCvPublicId(ownerId: string, originalName: string): string {
  const safeOwner = sanitizeSegment(ownerId) || "anonymous";
  const safeOriginal = sanitizeSegment(originalName) || "resume";
  const nameNoExt = sanitizeSegment(removeExtension(safeOriginal)).slice(0, 80) || "resume";
  const safeName = nameNoExt.replace(/\s+/g, "_");
  return `resumes/${safeOwner}_${Date.now()}_${safeName}`;
}

export function buildInternshipReportPublicId(ownerId: string, originalName: string): string {
  const safeOwner = sanitizeSegment(ownerId) || "anonymous";
  const safeOriginal = sanitizeSegment(originalName) || "report";
  const nameNoExt = sanitizeSegment(removeExtension(safeOriginal)).slice(0, 80) || "report";
  const safeName = nameNoExt.replace(/\s+/g, "_");
  return `internship_reports/${safeOwner}_${Date.now()}_${safeName}`;
}

function licensePublicIdSuffix(originalName: string): string {
  const ext = path.extname(String(originalName || "").trim()).toLowerCase();
  if (/^\.(pdf|docx?)$/i.test(ext)) return ext.replace(/[^.a-z0-9]/gi, "") || ".pdf";
  return ".pdf";
}

export function buildEnterpriseLicensePublicId(ownerKey: string, originalName: string): string {
  const safeOwner = sanitizeSegment(ownerKey) || "enterprise";
  const safeOriginal = sanitizeSegment(originalName) || "business_license";
  const nameNoExt = sanitizeSegment(removeExtension(safeOriginal)).slice(0, 80) || "business_license";
  const safeName = nameNoExt.replace(/\s+/g, "_");
  const suffix = licensePublicIdSuffix(safeOriginal);
  return `enterprise_licenses/${safeOwner}_${Date.now()}_${safeName}${suffix}`;
}

export function buildEnterpriseLogoPublicId(ownerKey: string, originalName: string): string {
  const safeOwner = sanitizeSegment(ownerKey) || "enterprise";
  const safeOriginal = sanitizeSegment(originalName) || "company_logo";
  const nameNoExt = sanitizeSegment(removeExtension(safeOriginal)).slice(0, 80) || "company_logo";
  const safeName = nameNoExt.replace(/\s+/g, "_");
  return `enterprise_logos/${safeOwner}_${Date.now()}_${safeName}`;
}

function buildSignature(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export async function uploadCvBytesToCloudinary(input: {
  bytes: Buffer;
  mimeType: string;
  ownerId: string;
  originalName: string;
}): Promise<CloudinaryUploadResult> {
  return uploadBytesToCloudinary({
    bytes: input.bytes,
    mimeType: input.mimeType,
    publicId: buildCvPublicId(input.ownerId, input.originalName),
    resourceType: "raw"
  });
}

export async function uploadInternshipReportBytesToCloudinary(input: {
  bytes: Buffer;
  mimeType: string;
  ownerId: string;
  originalName: string;
}): Promise<CloudinaryUploadResult> {
  return uploadBytesToCloudinary({
    bytes: input.bytes,
    mimeType: input.mimeType,
    publicId: buildInternshipReportPublicId(input.ownerId, input.originalName),
    resourceType: "raw"
  });
}

export async function uploadEnterpriseLicenseBytesToCloudinary(input: {
  bytes: Buffer;
  mimeType: string;
  ownerKey: string;
  originalName: string;
}): Promise<CloudinaryUploadResult> {
  return uploadBytesToCloudinary({
    bytes: input.bytes,
    mimeType: input.mimeType,
    publicId: buildEnterpriseLicensePublicId(input.ownerKey, input.originalName),
    resourceType: "raw"
  });
}

export async function uploadEnterpriseLogoBytesToCloudinary(input: {
  bytes: Buffer;
  mimeType: string;
  ownerKey: string;
  originalName: string;
}): Promise<CloudinaryUploadResult> {
  return uploadBytesToCloudinary({
    bytes: input.bytes,
    mimeType: input.mimeType,
    publicId: buildEnterpriseLogoPublicId(input.ownerKey, input.originalName),
    resourceType: "image"
  });
}

async function uploadBytesToCloudinary(input: {
  bytes: Buffer;
  mimeType: string;
  publicId: string;
  resourceType: "raw" | "image";
}): Promise<CloudinaryUploadResult> {
  const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = requiredEnv("CLOUDINARY_API_SECRET");

  const timestamp = String(Math.floor(Date.now() / 1000));
  const publicId = input.publicId;

  const signParams: Record<string, string> = {
    public_id: publicId,
    timestamp
  };
  const signature = buildSignature(signParams, apiSecret);

  const form = new FormData();
  const fileDataUrl = `data:${input.mimeType};base64,${input.bytes.toString("base64")}`;
  form.set("file", fileDataUrl);
  form.set("api_key", apiKey);
  form.set("timestamp", timestamp);
  form.set("public_id", publicId);
  form.set("resource_type", input.resourceType);
  form.set("signature", signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${input.resourceType}/upload`;
  const res = await fetch(endpoint, { method: "POST", body: form });
  const data = (await res.json()) as any;

  if (!res.ok) {
    const msg = typeof data?.error?.message === "string" ? data.error.message : "Cloudinary upload failed";
    throw new Error(msg);
  }

  const outPublicId = String(data?.public_id || "");
  if (!outPublicId) throw new Error("Cloudinary response missing public_id");

  return { publicId: outPublicId };
}

function cloudinarySigningEnv(): { cloud_name: string; api_key: string; api_secret: string } | null {
  const cloud_name =
    String(process.env.CLOUDINARY_CLOUD_NAME || "").trim() ||
    String(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "").trim();
  const api_key = String(process.env.CLOUDINARY_API_KEY || "").trim();
  const api_secret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
  if (!cloud_name || !api_key || !api_secret) return null;
  return { cloud_name, api_key, api_secret };
}

/**
 * Tải file raw/image từ Cloudinary (proxy API).
 * Thứ tự: URL ký (SDK) → raw delivery công khai → image delivery (fallback public_id nhầm loại).
 */
function pushUnsignedRawDeliveryVariants(pid: string, push: (u: string | null | undefined) => void) {
  const base = buildCloudinaryRawDeliveryUrl(pid);
  if (!base) return;
  // Public_id có thư mục: CDN thường cần segment `v1` (trùng hành vi SDK khi force_version).
  if (pid.includes("/")) {
    const parts = base.split("/raw/upload/");
    if (parts.length === 2) {
      push(`${parts[0]}/raw/upload/v1/${parts[1]}`);
    }
  }
  push(base);
}

function isLikelyCloudinaryErrorBody(contentType: string, bytes: Buffer): boolean {
  const ct = contentType.split(";")[0].trim();
  if (ct === "application/json" || ct === "text/html" || ct === "text/plain") return true;
  if (bytes.length > 0 && bytes.length < 512) {
    const head = bytes.subarray(0, 1).toString("ascii");
    if (head === "{" || head === "<") return true;
  }
  return false;
}

export async function fetchCloudinaryBytesByPublicId(publicId: string): Promise<{ bytes: Buffer; contentType: string } | null> {
  const pid = String(publicId || "").trim().replace(/^\/+/, "");
  if (!pid) return null;

  const urls: string[] = [];
  const seen = new Set<string>();
  const push = (u: string | null | undefined) => {
    const s = String(u || "").trim();
    if (s && !seen.has(s)) {
      seen.add(s);
      urls.push(s);
    }
  };

  const cred = cloudinarySigningEnv();
  if (cred) {
    cloudinary.config({
      cloud_name: cred.cloud_name,
      api_key: cred.api_key,
      api_secret: cred.api_secret,
      secure: true
    });
    const signedBase = {
      secure: true,
      sign_url: true,
      cloud_name: cred.cloud_name,
      api_secret: cred.api_secret
    } as const;
    try {
      push(cloudinary.url(pid, { ...signedBase, resource_type: "raw" }));
    } catch (e) {
      console.warn("cloudinary.url raw signed failed", e);
    }
    try {
      push(cloudinary.url(pid, { ...signedBase, resource_type: "image" }));
    } catch {
      /* ignore */
    }
  }

  pushUnsignedRawDeliveryVariants(pid, push);
  push(buildCloudinaryImageDeliveryUrl(pid));

  const headers: Record<string, string> = {
    Accept: "*/*",
    "User-Agent": "UTC-Manage-FileProxy/1.0"
  };

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store", headers });
      if (!res.ok) continue;
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length === 0) continue;
      const contentType = String(res.headers.get("content-type") || "").trim().toLowerCase();
      if (isLikelyCloudinaryErrorBody(contentType, bytes)) continue;
      return { bytes, contentType };
    } catch {
      continue;
    }
  }
  return null;
}
