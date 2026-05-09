import crypto from "crypto";
import path from "path";

export type CloudinaryUploadResult = {
  publicId: string;
};

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
  return `resumes/${safeOwner}_${Date.now()}_${nameNoExt}`;
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
  const cloudName = requiredEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requiredEnv("CLOUDINARY_API_KEY");
  const apiSecret = requiredEnv("CLOUDINARY_API_SECRET");

  const timestamp = String(Math.floor(Date.now() / 1000));
  const publicId = buildCvPublicId(input.ownerId, input.originalName);

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
  form.set("resource_type", "raw");
  form.set("signature", signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/raw/upload`;
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
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/raw/upload/${pid}`;
}

