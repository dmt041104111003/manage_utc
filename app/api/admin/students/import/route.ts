import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/admin-session";
import { hashPassword } from "@/lib/auth/password";
import { AUTH_EMAIL_REGISTER_PATTERN } from "@/lib/constants/auth/patterns";
import { fetchProvinceList, fetchWardsForProvince } from "@/lib/vn-open-api";

const MSV_PATTERN = /^\d{8,15}$/;
const NAME_PATTERN = /^[\p{L}\s]{1,255}$/u;
const PHONE_PATTERN = /^\d{8,12}$/;
const CLASS_PATTERN = /^[\p{L}\d]{1,255}$/u;
const KHOL_PATTERN = /^[\p{L}\d]{1,10}$/u;

const ALLOWED_DEGREE_TEXT = new Map<string, "BACHELOR" | "ENGINEER">([
  ["cu nhan", "BACHELOR"],
  ["ky su", "ENGINEER"]
]);

const ALLOWED_GENDER_TEXT = new Map<string, "MALE" | "FEMALE" | "OTHER">([
  ["nam", "MALE"],
  ["nu", "FEMALE"],
  ["khac", "OTHER"]
]);

async function resolveFromNamesToCodes(provinceName: string, wardName: string) {
  const provinces = await fetchProvinceList();
  const prov = provinces.find((p) => p.name.toLowerCase().trim() === provinceName.toLowerCase().trim());
  if (!prov) return { provinceCode: null as string | null, wardCode: null as string | null };
  const wards = await fetchWardsForProvince(String(prov.code));
  const ward = wards.find((w) => w.name.toLowerCase().trim() === wardName.toLowerCase().trim());
  return { provinceCode: String(prov.code), wardCode: ward ? String(ward.code) : null };
}

async function resolveProvinceWardNames(provinceCode: string, wardCode: string) {
  const provinces = await fetchProvinceList();
  const prov = provinces.find((p) => String(p.code) === String(provinceCode));
  if (!prov) return { provinceName: null as string | null, wardName: null as string | null };
  const wards = await fetchWardsForProvince(String(provinceCode));
  const ward = wards.find((w) => String(w.code) === String(wardCode));
  return { provinceName: prov.name, wardName: ward?.name ?? null };
}

type ImportRow = {
  line: number;
  msv: string;
  fullName: string;
  className: string;
  faculty: string;
  cohort: string;
  degree: string; // raw text (Cử nhân/Kỹ sư) or enum
  phone: string;
  email: string;
  birthDate: string; // YYYY-MM-DD
  gender: string; // raw text
  permanentProvinceCode?: string;
  permanentWardCode?: string;
  permanentProvinceName?: string;
  permanentWardName?: string;
};

function normalizeText(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function validateRowFormat(row: ImportRow) {
  const line = row.line;
  const missing = (v: unknown) => v == null || String(v).trim() === "";
  const invalid = () => ({ ok: false as const, message: `Dòng ${line} có dữ liệu nhập vào k đúng định dạng. Vui lòng kt lại` });
  const requiredMissing =
    missing(row.msv) ||
    missing(row.fullName) ||
    missing(row.className) ||
    missing(row.faculty) ||
    missing(row.cohort) ||
    missing(row.phone) ||
    missing(row.email) ||
    missing(row.birthDate) ||
    missing(row.gender) ||
    missing(row.degree) ||
    (missing(row.permanentProvinceCode) && missing(row.permanentProvinceName)) ||
    (missing(row.permanentWardCode) && missing(row.permanentWardName));

  if (requiredMissing) return { ok: false as const, message: `Dòng ${line} trong file Excel thiếu dữ liệu. Vui lòng kt lại` };

  if (!MSV_PATTERN.test(String(row.msv).trim())) return invalid();
  if (!NAME_PATTERN.test(String(row.fullName).trim())) return invalid();
  if (!PHONE_PATTERN.test(String(row.phone).trim())) return invalid();
  if (!AUTH_EMAIL_REGISTER_PATTERN.test(String(row.email).trim())) return invalid();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.birthDate).trim())) return invalid();

  const birth = new Date(`${String(row.birthDate).trim()}T00:00:00.000Z`);
  if (Number.isNaN(birth.getTime())) return invalid();
  const age = (() => {
    let a = new Date().getFullYear() - birth.getUTCFullYear();
    const m = new Date().getUTCMonth() - birth.getUTCMonth();
    if (m < 0 || (m === 0 && new Date().getUTCDate() < birth.getUTCDate())) a -= 1;
    return a;
  })();
  if (age < 18) return invalid();

  if (!CLASS_PATTERN.test(String(row.className).trim())) return invalid();
  if (!KHOL_PATTERN.test(String(row.cohort).trim())) return invalid();

  const provinceOk = !missing(row.permanentProvinceCode) || !missing(row.permanentProvinceName);
  const wardOk = !missing(row.permanentWardCode) || !missing(row.permanentWardName);
  if (!provinceOk || !wardOk) return invalid();

  const degreeNorm = normalizeText(row.degree);
  const genderNorm = normalizeText(row.gender);
  if (!ALLOWED_DEGREE_TEXT.has(degreeNorm)) return invalid();
  if (!ALLOWED_GENDER_TEXT.has(genderNorm)) return invalid();

  return { ok: true as const };
}

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const body = (await request.json()) as { rows?: ImportRow[] };
  const rows = Array.isArray(body.rows) ? body.rows : [];
  if (!rows.length) return NextResponse.json({ success: false, message: "File Excel k có dữ liệu. Vui lòng kt lại" }, { status: 400 });

  // client should already send valid line numbers, but we keep it
  // duplicates within file
  const seenMsv = new Map<string, number>();
  const seenEmail = new Map<string, number>();
  const seenPhone = new Map<string, number>();

  for (const r of rows) {
    const v = validateRowFormat(r);
    if (!v.ok) return NextResponse.json({ success: false, message: v.message }, { status: 400 });

    const msv = String(r.msv).trim();
    const email = String(r.email).trim().toLowerCase();
    const phone = String(r.phone).trim();

    if (seenMsv.has(msv)) return NextResponse.json({ success: false, message: `Dòng ${r.line} đang có nhiều dòng dữ liệu trong file Excel. Vui lòng kiểm tra lại.` }, { status: 400 });
    if (seenEmail.has(email)) return NextResponse.json({ success: false, message: `Dòng ${r.line} đang có nhiều dòng dữ liệu trong file Excel. Vui lòng kiểm tra lại.` }, { status: 400 });
    if (seenPhone.has(phone)) return NextResponse.json({ success: false, message: `Dòng ${r.line} đang có nhiều dòng dữ liệu trong file Excel. Vui lòng kiểm tra lại.` }, { status: 400 });

    seenMsv.set(msv, r.line);
    seenEmail.set(email, r.line);
    seenPhone.set(phone, r.line);
  }

  const prismaAny = prisma as any;

  // existing in system
  const ms2 = rows.map((r) => String(r.msv).trim());
  const emails = rows.map((r) => String(r.email).trim().toLowerCase());
  const phones = rows.map((r) => String(r.phone).trim());

  const existingProfiles = await prismaAny.studentProfile.findMany({ where: { msv: { in: ms2 } }, select: { msv: true } });
  const existingUsers = await prismaAny.user.findMany({ where: { OR: [{ email: { in: emails } }, { phone: { in: phones } }] }, select: { email: true, phone: true } });
  const existingMsvSet = new Set(existingProfiles.map((x: any) => String(x.msv)));
  const existingEmailSet = new Set(existingUsers.filter((u: any) => u.email).map((u: any) => String(u.email).toLowerCase()));
  const existingPhoneSet = new Set(existingUsers.filter((u: any) => u.phone).map((u: any) => String(u.phone)));

  for (const r of rows) {
    const msv = String(r.msv).trim();
    const email = String(r.email).trim().toLowerCase();
    const phone = String(r.phone).trim();
    if (existingMsvSet.has(msv) || existingEmailSet.has(email) || existingPhoneSet.has(phone)) {
      return NextResponse.json(
        { success: false, message: `Dòng ${r.line} trong file Excel chứa thông tin đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.` },
        { status: 400 }
      );
    }
  }

  // create
  for (const r of rows) {
    const msv = String(r.msv).trim();
    const fullName = String(r.fullName).trim();
    const phone = String(r.phone).trim();
    const email = String(r.email).trim().toLowerCase();
    const birthDateStr = String(r.birthDate).trim();

    const degreeNorm = normalizeText(r.degree);
    const genderNorm = normalizeText(r.gender);
    const degree = ALLOWED_DEGREE_TEXT.get(degreeNorm) as "BACHELOR" | "ENGINEER";
    const gender = ALLOWED_GENDER_TEXT.get(genderNorm) as "MALE" | "FEMALE" | "OTHER";

    let provinceCode = r.permanentProvinceCode ? String(r.permanentProvinceCode).trim() : "";
    let wardCode = r.permanentWardCode ? String(r.permanentWardCode).trim() : "";
    if (!provinceCode || !wardCode) {
      const resolved = await resolveFromNamesToCodes(String(r.permanentProvinceName || "").trim(), String(r.permanentWardName || "").trim());
      provinceCode = resolved.provinceCode || "";
      wardCode = resolved.wardCode || "";
    }

    if (!provinceCode || !wardCode) {
      return NextResponse.json({ success: false, message: `Dòng ${r.line} có dữ liệu nhập vào k đúng định dạng. Vui lòng kt lại` }, { status: 400 });
    }

    const { provinceName, wardName } = await resolveProvinceWardNames(provinceCode, wardCode);
    if (!provinceName || !wardName) {
      return NextResponse.json({ success: false, message: `Dòng ${r.line} có dữ liệu nhập vào k đúng định dạng. Vui lòng kt lại` }, { status: 400 });
    }

    const user = await prismaAny.user.create({
      data: {
        email,
        phone,
        passwordHash: await hashPassword(birthDateStr),
        fullName,
        role: "sinhvien",
        isLocked: false,
        enterpriseStatus: null,
        companyName: null,
        taxCode: null,
        representativeTitle: null,
        enterpriseMeta: null
      },
      select: { id: true }
    });

    await prismaAny.studentProfile.create({
      data: {
        userId: user.id,
        msv,
        className: String(r.className).trim(),
        faculty: String(r.faculty).trim(),
        cohort: String(r.cohort).trim(),
        degree,
        gender,
        birthDate: new Date(`${birthDateStr}T00:00:00.000Z`),
        permanentProvinceCode: provinceCode,
        permanentProvinceName: provinceName,
        permanentWardCode: wardCode,
        permanentWardName: wardName,
        internshipStatus: "NOT_STARTED"
      }
    });
  }

  return NextResponse.json({ success: true, message: "Tạo danh sách sinh viên thành công." });
}

