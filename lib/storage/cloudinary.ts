import crypto from "crypto";
import path from "path";

export type CloudinaryUploadResult = {
  publicId: string;
};

export const CLOUDINARY_REF_PREFIX = "cloudinary:";

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

export function buildEnterpriseLicensePublicId(ownerKey: string, originalName: string): string {
  const safeOwner = sanitizeSegment(ownerKey) || "enterprise";
  const safeOriginal = sanitizeSegment(originalName) || "business_license";
  const nameNoExt = sanitizeSegment(removeExtension(safeOriginal)).slice(0, 80) || "business_license";
  const safeName = nameNoExt.replace(/\s+/g, "_");
  return `enterprise_licenses/${safeOwner}_${Date.now()}_${safeName}`;
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

export function buildCloudinaryRawDeliveryUrl(publicId: string): string {
  const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
  const pid = String(publicId || "").replace(/^\/+/, "");
  const encodedPid = pid
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/raw/upload/${encodedPid}`;
}

export function buildCloudinaryImageDeliveryUrl(publicId: string): string {
  const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
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

