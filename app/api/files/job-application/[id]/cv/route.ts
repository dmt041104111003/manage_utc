import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { buildCloudinaryRawDeliveryUrl } from "@/lib/storage/cloudinary";

function safeFilename(name: string): string {
  return String(name || "cv.pdf").replace(/["\r\n]/g, "").trim() || "cv.pdf";
}

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 }) };
  try {
    const verified = await verifySession(token);
    return { sub: verified.sub, role: verified.role };
  } catch {
    return { error: NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 }) };
  }
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const sess = await getSession();
  if ((sess as any).error) return (sess as any).error;
  const { sub, role } = sess as { sub: string; role: string };

  const { id } = await ctx.params;
  const download = new URL(request.url).searchParams.get("download") === "1";

  const prismaAny = prisma as any;
  const row = await prismaAny.jobApplication.findFirst({
    where: { id },
    select: {
      id: true,
      studentUserId: true,
      cvPublicId: true,
      cvFileName: true,
      cvMime: true,
      jobPost: { select: { enterpriseUserId: true } }
    }
  });
  if (!row) return NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ." }, { status: 404 });

  const allowed =
    role === "admin" || (role === "sinhvien" && row.studentUserId === sub) || (role === "doanhnghiep" && row.jobPost.enterpriseUserId === sub);
  if (!allowed) return NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 });

  const publicId = String(row.cvPublicId || "").trim();
  if (!publicId) return NextResponse.json({ success: false, message: "Không có file CV." }, { status: 404 });

  let bytes: Buffer;
  let mime: string;
  try {
    const deliveryUrl = buildCloudinaryRawDeliveryUrl(publicId);
    if (!deliveryUrl) {
      return NextResponse.json(
        { success: false, message: "Cấu hình lưu trữ file chưa sẵn sàng (thiếu tên cloud)." },
        { status: 503 }
      );
    }
    const upstream = await fetch(deliveryUrl);
    if (!upstream.ok) return NextResponse.json({ success: false, message: "Không thể tải file CV." }, { status: 502 });
    const ab = await upstream.arrayBuffer();
    bytes = Buffer.from(ab);
    const upstreamType = String(upstream.headers.get("content-type") || "").trim().toLowerCase();
    const fallbackType = String(row.cvMime || "").trim().toLowerCase();
    mime =
      !upstreamType || upstreamType === "application/octet-stream"
        ? fallbackType || "application/pdf"
        : upstreamType;
  } catch {
    return NextResponse.json({ success: false, message: "Không thể tải file CV." }, { status: 500 });
  }

  const filename = safeFilename(row.cvFileName || "cv.pdf");
  const disposition = `${download ? "attachment" : "inline"}; filename="${filename}"`;

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

