import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

type GuidanceStatus = "GUIDING" | "COMPLETED";

async function getGiangVienProfileId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { error: NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 }) };
  try {
    const verified = await verifySession(token);
    if (verified.role !== "giangvien") return { error: NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 }) };
    const prismaAny = prisma as any;
    const sup = await prismaAny.supervisorProfile.findFirst({ where: { userId: verified.sub }, select: { id: true } });
    if (!sup) return { error: NextResponse.json({ success: false, message: "Không tìm thấy hồ sơ giảng viên." }, { status: 404 }) };
    return { supervisorProfileId: sup.id };
  } catch {
    return { error: NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 }) };
  }
}

export async function GET(request: Request) {
  const giangVien = await getGiangVienProfileId();
  if ("error" in giangVien) return giangVien.error;
  const supervisorProfileId = giangVien.supervisorProfileId as string;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const internshipBatchId = (searchParams.get("batchId") || "").trim();
  const guidanceStatus = (searchParams.get("status") || "all").trim();

  const prismaAny = prisma as any;

  const batchIdsRows = await prismaAny.supervisorAssignment.findMany({
    where: { supervisorProfileId },
    distinct: ["internshipBatchId"],
    select: { internshipBatchId: true }
  });
  const batchIds = batchIdsRows.map((r: any) => r.internshipBatchId).filter(Boolean);

  const batchOptionsRows = batchIds.length
    ? await prismaAny.internshipBatch.findMany({
        where: { id: { in: batchIds } },
        select: { id: true, name: true, startDate: true },
        orderBy: { startDate: "desc" }
      })
    : [];

  const batchOptions = batchOptionsRows.map((r: any) => ({ id: String(r.id), name: r.name }));

  // Đợt mới nhất (theo ngày bắt đầu) mà GV có phân công
  const latestBatchRow = batchOptionsRows[0] ?? null;
  let latestBatchGuidanceStats: {
    batchId: string | null;
    batchName: string | null;
    guiding: number;
    completed: number;
  } = { batchId: null, batchName: null, guiding: 0, completed: 0 };

  if (latestBatchRow) {
    const bid = String(latestBatchRow.id);
    const [guiding, completed] = await Promise.all([
      prismaAny.supervisorAssignmentStudent.count({
        where: {
          supervisorAssignment: {
            supervisorProfileId,
            internshipBatchId: bid,
            status: "GUIDING"
          }
        }
      }),
      prismaAny.supervisorAssignmentStudent.count({
        where: {
          supervisorAssignment: {
            supervisorProfileId,
            internshipBatchId: bid,
            status: "COMPLETED"
          }
        }
      })
    ]);
    latestBatchGuidanceStats = {
      batchId: bid,
      batchName: latestBatchRow.name ?? null,
      guiding,
      completed
    };
  }

  const where: any = {
    supervisorAssignment: {
      supervisorProfileId
    }
  };
  if (internshipBatchId) where.supervisorAssignment.internshipBatchId = internshipBatchId;
  if (guidanceStatus !== "all") where.supervisorAssignment.status = guidanceStatus as GuidanceStatus;

  if (q) {
    where.studentProfile = {
      OR: [
        { msv: { contains: q, mode: "insensitive" } },
        { user: { fullName: { contains: q, mode: "insensitive" } } }
      ]
    };
  }

  const links = await prismaAny.supervisorAssignmentStudent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      studentProfile: {
        select: {
          id: true,
          msv: true,
          className: true,
          faculty: true,
          cohort: true,
          degree: true,
          gender: true,
          birthDate: true,
          permanentProvinceName: true,
          permanentWardName: true,
          internshipStatus: true,
          user: { select: { fullName: true, phone: true, email: true } },
          internshipStatusHistory: {
            orderBy: { at: "desc" },
            select: { fromStatus: true, toStatus: true, at: true }
          },
          internshipReport: {
            select: {
              id: true,
              reportFileName: true,
              reviewStatus: true,
              supervisorEvaluation: true,
              supervisorPoint: true,
              enterpriseEvaluation: true,
              enterprisePoint: true
            }
          }
        }
      },
      supervisorAssignment: {
        select: {
          status: true,
          statusHistory: {
            orderBy: { at: "desc" },
            select: { fromStatus: true, toStatus: true, at: true }
          }
        }
      }
    }
  });

  const guidanceStatusLabel: Record<GuidanceStatus, string> = { GUIDING: "Đang hướng dẫn", COMPLETED: "Hoàn thành hướng dẫn" };

  const items = links.map((x: any, idx: number) => {
    const sp = x.studentProfile;
    const assignment = x.supervisorAssignment;
    const r = sp.internshipReport;
    return {
      id: sp.id,
      stt: idx + 1,
      msv: sp.msv,
      fullName: sp.user?.fullName ?? "",
      className: sp.className,
      faculty: sp.faculty,
      cohort: sp.cohort,
      degree: sp.degree,
      guidanceStatus: assignment?.status as GuidanceStatus,
      guidanceStatusLabel: guidanceStatusLabel[assignment?.status as GuidanceStatus] ?? String(assignment?.status ?? ""),
      phone: sp.user?.phone ?? null,
      email: sp.user?.email ?? "",
      birthDate: sp.birthDate?.toISOString?.() ?? null,
      gender: sp.gender,
      permanentAddress: [sp.permanentProvinceName, sp.permanentWardName].filter(Boolean).join(" - ") || "—",
      internshipStatus: sp.internshipStatus,
      internshipStatusHistory: (sp.internshipStatusHistory || []).map((h: any) => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        at: h.at?.toISOString?.() ?? null
      })),
      guidanceStatusHistory: (assignment?.statusHistory || []).map((h: any) => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        at: h.at?.toISOString?.() ?? null
      })),
      report: r
        ? {
            id: r.id,
            reportFileName: r.reportFileName,
            reportUrl: `/api/files/internship-report/${r.id}`,
            reviewStatus: r.reviewStatus,
            supervisorEvaluation: r.supervisorEvaluation ?? null,
            supervisorPoint: r.supervisorPoint ?? null,
            enterpriseEvaluation: r.enterpriseEvaluation ?? null,
            enterprisePoint: r.enterprisePoint ?? null
          }
        : null
    };
  });

  return NextResponse.json({
    success: true,
    items,
    batches: batchOptions,
    latestBatchGuidanceStats
  });
}
