import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME, AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { fetchProvinceList, fetchWardsForProvince } from "@/lib/vn-open-api";
import { uploadCvBytesToCloudinary } from "@/lib/storage/cloudinary";
import { sniffBinaryKind } from "@/lib/utils/binary-file-sniff";

const PHONE_PATTERN = /^\d{8,12}$/;
const CV_ALLOWED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
] as const;

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

async function resolveProvinceWardNames(provinceCode: string, wardCode: string) {
  const provinces = await fetchProvinceList();
  const prov = provinces.find((p) => String(p.code) === String(provinceCode));
  if (!prov) return { provinceName: null as string | null, wardName: null as string | null };
  const wards = await fetchWardsForProvince(String(provinceCode));
  const ward = wards.find((w) => String(w.code) === String(wardCode));
  return { provinceName: prov.name, wardName: ward?.name ?? null };
}

export async function GET() {
  const auth = await getStudentUserId();
  if (auth.error) return auth.error;
  const userId = auth.userId as string;
  const prismaAny = prisma as any;

  const row = await prismaAny.studentProfile.findFirst({
    where: { userId },
    select: {
      msv: true,
      className: true,
      faculty: true,
      cohort: true,
      degree: true,
      birthDate: true,
      gender: true,
      user: { select: { fullName: true, phone: true, email: true } },
      currentProvinceCode: true,
      currentProvinceName: true,
      currentWardCode: true,
      currentWardName: true,
      intro: true,
      cvFileName: true,
      cvMime: true,
      cvPublicId: true
    }
  });
  if (!row) return NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ sinh viên." }, { status: 404 });

  return NextResponse.json({
    success: true,
    item: {
      fullName: row.user?.fullName ?? "",
      className: row.className,
      faculty: row.faculty,
      cohort: row.cohort,
      degree: row.degree,
      birthDate: row.birthDate?.toISOString?.() ?? null,
      gender: row.gender,
      phone: row.user?.phone ?? "",
      email: row.user?.email ?? "",
      currentProvinceCode: row.currentProvinceCode ?? "",
      currentProvinceName: row.currentProvinceName ?? null,
      currentWardCode: row.currentWardCode ?? "",
      currentWardName: row.currentWardName ?? null,
      intro: row.intro ?? "",
      cvFileName: row.cvFileName ?? null,
      cvMime: row.cvMime ?? null,
      hasCv: Boolean(row.cvPublicId)
    }
  });
}

export async function PATCH(request: Request) {
  const auth = await getStudentUserId();
  if (auth.error) return auth.error;
  const userId = auth.userId as string;
  const form = await request.formData();

  const phone = String(form.get("phone") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const currentProvinceCode = String(form.get("currentProvinceCode") || "").trim();
  const currentWardCode = String(form.get("currentWardCode") || "").trim();
  const intro = String(form.get("intro") || "").trim();
  const cvFile = form.get("cv");
  const removeCv = String(form.get("removeCv") || "") === "1";

  const errors: Record<string, string> = {};
  if (!PHONE_PATTERN.test(phone)) errors.phone = "Số điện thoại chỉ gồm số (8–12 ký tự).";
  if (!AUTH_EMAIL_REGISTER_PATTERN.test(email)) errors.email = "Email không đúng định dạng (ví dụ: example@domain.com).";
  if (!currentProvinceCode || !/^\d+$/.test(currentProvinceCode)) errors.currentProvinceCode = "Tỉnh/thành không hợp lệ.";
  if (!currentWardCode || !/^\d+$/.test(currentWardCode)) errors.currentWardCode = "Phường/xã không hợp lệ.";
  if (!intro) errors.intro = "Thư giới thiệu bản thân bắt buộc.";
  if (intro.length > 3000) errors.intro = "Thư giới thiệu bản thân tối đa 3000 ký tự.";

  let cvPatch: { cvFileName: string; cvMime: string; bytes: Buffer } | null = null;
  if (cvFile && cvFile instanceof File) {
    const ab = await cvFile.arrayBuffer();
    const bytes = Buffer.from(ab);
    const browserMime = String(cvFile.type || "").trim().toLowerCase();
    const sniff = sniffBinaryKind(bytes);
    const sniffMime = String(sniff?.mime || "").trim().toLowerCase();

    const allowed = (m: string) => CV_ALLOWED_MIMES.includes(m as any);
    const effectiveMime = allowed(browserMime) ? browserMime : allowed(sniffMime) ? sniffMime : "";
    if (!effectiveMime) {
      errors.cv = "File CV không hợp lệ. Chỉ hỗ trợ .pdf, .doc, .docx.";
    } else {
      cvPatch = { cvFileName: cvFile.name || "cv", cvMime: effectiveMime, bytes };
    }
  }

  if (Object.keys(errors).length) return NextResponse.json({ success: false, errors }, { status: 400 });

  const prismaAny = prisma as any;
  const existedEmail = await prismaAny.user.findFirst({ where: { email, id: { not: userId } }, select: { id: true } });
  const existedPhone = await prismaAny.user.findFirst({ where: { phone, id: { not: userId } }, select: { id: true } });
  if (existedEmail) return NextResponse.json({ success: false, errors: { email: "Email đã tồn tại trong hệ thống." } }, { status: 400 });
  if (existedPhone) return NextResponse.json({ success: false, errors: { phone: "Số điện thoại đã tồn tại trong hệ thống." } }, { status: 400 });

  const { provinceName, wardName } = await resolveProvinceWardNames(currentProvinceCode, currentWardCode);
  if (!provinceName || !wardName) {
    return NextResponse.json(
      { success: false, errors: { currentProvinceCode: "Tỉnh/thành hoặc phường/xã không tồn tại.", currentWardCode: "Tỉnh/thành hoặc phường/xã không tồn tại." } },
      { status: 400 }
    );
  }

  const cvUpload = cvPatch
    ? await uploadCvBytesToCloudinary({
        bytes: cvPatch.bytes,
        mimeType: cvPatch.cvMime,
        ownerId: userId,
        originalName: cvPatch.cvFileName
      })
    : null;

  await prismaAny.$transaction(async (tx: any) => {
    await tx.user.update({ where: { id: userId }, data: { phone, email } });
    await tx.studentProfile.update({
      where: { userId },
      data: {
        currentProvinceCode,
        currentProvinceName: provinceName,
        currentWardCode,
        currentWardName: wardName,
        intro,
        ...(removeCv
          ? { cvPublicId: null, cvFileName: null, cvMime: null }
          : cvPatch
            ? { cvPublicId: cvUpload?.publicId ?? null, cvFileName: cvPatch.cvFileName, cvMime: cvPatch.cvMime }
            : {})
      }
    });
  });

  return NextResponse.json({ success: true, message: "Cập nhật hồ sơ sinh viên thành công." });
}

