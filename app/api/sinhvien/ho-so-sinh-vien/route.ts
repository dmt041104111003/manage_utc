import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME, AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { fetchProvinceList, fetchWardsForProvince } from "@/lib/vn-open-api";
import { decodeEnterpriseFilePayload } from "@/lib/enterprise-register-files";

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
      cvBase64: true
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
      cvBase64: row.cvBase64 ?? null
    }
  });
}

type PatchBody = {
  phone: string;
  email: string;
  currentProvinceCode: string;
  currentWardCode: string;
  intro: string;
  cvFileName?: string;
  cvMime?: string;
  cvBase64?: string;
};

export async function PATCH(request: Request) {
  const auth = await getStudentUserId();
  if (auth.error) return auth.error;
  const userId = auth.userId as string;
  const body = (await request.json()) as PatchBody;

  const phone = (body.phone || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const currentProvinceCode = (body.currentProvinceCode || "").trim();
  const currentWardCode = (body.currentWardCode || "").trim();
  const intro = (body.intro || "").trim();

  const errors: Record<string, string> = {};
  if (!PHONE_PATTERN.test(phone)) errors.phone = "Số điện thoại chỉ gồm số (8–12 ký tự).";
  if (!AUTH_EMAIL_REGISTER_PATTERN.test(email)) errors.email = "Email không đúng định dạng (ví dụ: example@domain.com).";
  if (!currentProvinceCode || !/^\d+$/.test(currentProvinceCode)) errors.currentProvinceCode = "Tỉnh/thành không hợp lệ.";
  if (!currentWardCode || !/^\d+$/.test(currentWardCode)) errors.currentWardCode = "Phường/xã không hợp lệ.";
  if (!intro) errors.intro = "Thư giới thiệu bản thân bắt buộc.";
  if (intro.length > 3000) errors.intro = "Thư giới thiệu bản thân tối đa 3000 ký tự.";

  let cvPatch: { cvFileName: string; cvMime: string; cvBase64: string } | null = null;
  if (body.cvBase64 || body.cvMime || body.cvFileName) {
    const decoded = decodeEnterpriseFilePayload(body.cvBase64, body.cvMime, CV_ALLOWED_MIMES);
    if (!decoded.ok) {
      errors.cv = decoded.message;
    } else {
      const fileName = (body.cvFileName || "cv").trim();
      cvPatch = { cvFileName: fileName, cvMime: decoded.mime, cvBase64: decoded.base64 };
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
        ...(cvPatch
          ? { cvFileName: cvPatch.cvFileName, cvMime: cvPatch.cvMime, cvBase64: cvPatch.cvBase64 }
          : {})
      }
    });
  });

  return NextResponse.json({ success: true, message: "Cập nhật hồ sơ sinh viên thành công." });
}

