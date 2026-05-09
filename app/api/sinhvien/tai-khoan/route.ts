import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 });

  let sub: string;
  let role: string;
  try {
    const verified = await verifySession(token);
    sub = verified.sub;
    role = verified.role;
  } catch {
    return NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
  }

  if (role !== "sinhvien") {
    return NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 });
  }

  const prismaAny = prisma as any;

  const profile = await prismaAny.studentProfile.findFirst({
    where: { userId: sub },
    select: {
      msv: true,
      className: true,
      faculty: true,
      cohort: true,
      degree: true,
      internshipStatus: true,
      birthDate: true,
      gender: true,
      permanentProvinceName: true,
      permanentWardName: true,
      user: {
        select: {
          fullName: true,
          phone: true,
          email: true
        }
      }
    }
  });

  if (!profile) {
    return NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ sinh viên." }, { status: 404 });
  }

  const assignmentLink = await prismaAny.supervisorAssignmentStudent.findFirst({
    where: { studentProfile: { userId: sub } },
    orderBy: { createdAt: "desc" },
    select: {
      supervisorAssignment: {
        select: {
          status: true,
          supervisorProfile: {
            select: {
              degree: true,
              gender: true,
              user: {
                select: {
                  fullName: true,
                  phone: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  const sup = assignmentLink?.supervisorAssignment?.supervisorProfile;

  return NextResponse.json({
    success: true,
    student: {
      msv: profile.msv,
      fullName: profile.user?.fullName ?? "",
      className: profile.className,
      faculty: profile.faculty,
      cohort: profile.cohort,
      degree: profile.degree,
      phone: profile.user?.phone ?? null,
      email: profile.user?.email ?? "",
      birthDate: profile.birthDate?.toISOString?.() ?? null,
      gender: profile.gender,
      address: [profile.permanentProvinceName, profile.permanentWardName].filter(Boolean).join(" - ") || null
    },
    supervisor: sup
      ? {
          fullName: sup.user?.fullName ?? "",
          phone: sup.user?.phone ?? null,
          email: sup.user?.email ?? "",
          gender: sup.gender ?? null,
          degree: sup.degree ?? null
        }
      : null
  });
}

