import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { buildCloudinaryRawDeliveryUrl } from "@/lib/storage/cloudinary";

function safeFilename(name: string): string {
  return String(name || "cv.pdf").replace(/["\r\n]/g, "").trim() || "cv.pdf";
}

async function getStudentUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 }) };
  try {
    const verified = await verifySession(token);
    if (verified.role !== "sinhvien") {
      return { error: NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 }) };
    }
    return { userId: verified.sub };
  } catch {
    return { error: NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 }) };
  }
}

export async function GET(request: Request) {
  const auth = await getStudentUserId();
  if (auth.error) return auth.error;
  const userId = auth.userId as string;

  const download = new URL(request.url).searchParams.get("download") === "1";

  const prismaAny = prisma as any;
  const row = await prismaAny.studentProfile.findFirst({
    where: { userId },
    select: { cvFileName: true, cvMime: true, cvPublicId: true }
  });
  if (!row) return NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ sinh viên." }, { status: 404 });

  const publicId = String(row.cvPublicId || "").trim();
  if (!publicId) return NextResponse.json({ success: false, message: "Không có file CV." }, { status: 404 });

  const deliveryUrl = buildCloudinaryRawDeliveryUrl(publicId);
  const upstream = await fetch(deliveryUrl);
  if (!upstream.ok) return NextResponse.json({ success: false, message: "Không thể tải file CV." }, { status: 502 });
  const ab = await upstream.arrayBuffer();
  const bytes = Buffer.from(ab);
  const mime = upstream.headers.get("content-type") || String(row.cvMime || "") || "application/pdf";

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

