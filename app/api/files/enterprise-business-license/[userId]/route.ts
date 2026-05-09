import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { cookies } from "next/headers";
import { getAdminSession } from "@/lib/auth/admin-session";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { enterpriseLicensePublicIdFromStored, fetchCloudinaryBytesByPublicId } from "@/lib/storage/cloudinary";

function safeFilename(name: string): string {
  return String(name || "giay-phep.pdf").replace(/["\r\n]/g, "").trim() || "giay-phep.pdf";
}

function readLicenseMeta(meta: unknown): {
  publicIdRef: string | null;
  mime: string;
  fileName: string;
  base64: string | null;
} {
  const m = meta && typeof meta === "object" && !Array.isArray(meta) ? (meta as Record<string, unknown>) : {};
  const publicIdRef = typeof m.businessLicensePublicId === "string" ? m.businessLicensePublicId.trim() : null;
  const mime = typeof m.businessLicenseMime === "string" && m.businessLicenseMime.trim() ? m.businessLicenseMime.trim() : "application/pdf";
  const fileName =
    typeof m.businessLicenseName === "string" && m.businessLicenseName.trim() ? m.businessLicenseName.trim() : "giay-phep.pdf";
  const base64 = typeof m.businessLicenseBase64 === "string" && m.businessLicenseBase64.trim() ? m.businessLicenseBase64.trim() : null;
  return { publicIdRef, mime, fileName, base64 };
}

export async function GET(request: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;
  const download = new URL(request.url).searchParams.get("download") === "1";

  const admin = await getAdminSession();
  let allowed = Boolean(admin);
  if (!allowed) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 });
    }
    try {
      const verified = await verifySession(token);
      allowed = verified.role === Role.doanhnghiep && verified.sub === userId;
    } catch {
      return NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
    }
  }

  if (!allowed) {
    return NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, enterpriseMeta: true }
  });
  if (!user || user.role !== Role.doanhnghiep) {
    return NextResponse.json({ success: false, message: "Không tìm thấy doanh nghiệp." }, { status: 404 });
  }

  const { publicIdRef, mime: metaMime, fileName, base64 } = readLicenseMeta(user.enterpriseMeta);
  const cloudPublicId = enterpriseLicensePublicIdFromStored(publicIdRef);

  let bytes: Buffer;
  let mime = metaMime || "application/pdf";

  if (cloudPublicId) {
    const fetched = await fetchCloudinaryBytesByPublicId(cloudPublicId);
    if (fetched) {
      bytes = fetched.bytes;
      const upstreamType = fetched.contentType;
      if (!upstreamType || upstreamType === "application/octet-stream") {
        mime = metaMime || "application/pdf";
      } else {
        mime = upstreamType;
      }
    } else if (base64) {
      try {
        bytes = Buffer.from(base64, "base64");
        mime = metaMime || "application/pdf";
        console.warn("enterprise-business-license: Cloudinary lỗi, dùng base64 trong meta userId=", userId);
      } catch {
        return NextResponse.json({ success: false, message: "File giấy phép không hợp lệ." }, { status: 500 });
      }
    } else {
      console.error("enterprise-business-license cloudinary fetch failed publicId=", cloudPublicId);
      return NextResponse.json({ success: false, message: "Không thể tải file giấy phép." }, { status: 502 });
    }
  } else if (base64) {
    try {
      bytes = Buffer.from(base64, "base64");
    } catch {
      return NextResponse.json({ success: false, message: "File giấy phép không hợp lệ." }, { status: 500 });
    }
  } else {
    return NextResponse.json({ success: false, message: "Không có file giấy phép." }, { status: 404 });
  }

  const filename = safeFilename(fileName);
  const disposition = `${download ? "attachment" : "inline"}; filename="${filename}"`;

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": disposition,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
