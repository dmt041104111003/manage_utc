import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";
import { DOANHNGHIEP_UNG_VIEN_DETAIL_PAGE_SIZE } from "@/lib/constants/doanhnghiep-ung-vien-detail";
import { fetchProvinceList, fetchWardsForProvince } from "@/lib/vn-open-api";

function extractHistoryMeta(history: any[]): {
  responseDeadline: string | null;
  interviewLocation: string | null;
} {
  if (!Array.isArray(history) || !history.length) {
    return { responseDeadline: null, interviewLocation: null };
  }
  // Find the last STATUS_UPDATE event that set INTERVIEW_INVITED or OFFERED
  let responseDeadline: string | null = null;
  let interviewLocation: string | null = null;
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i] as Record<string, unknown>;
    if (h?.action === "STATUS_UPDATE") {
      if (!responseDeadline && typeof h?.responseDeadline === "string") {
        responseDeadline = h.responseDeadline;
      }
      if (!interviewLocation && typeof h?.interviewLocation === "string") {
        interviewLocation = h.interviewLocation;
      }
      if (responseDeadline && interviewLocation) break;
    }
  }
  return { responseDeadline, interviewLocation };
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
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
  if (role !== "doanhnghiep") return NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page") || "1") || 1, 1);
  const pageSize = Math.max(Number(searchParams.get("pageSize") || String(DOANHNGHIEP_UNG_VIEN_DETAIL_PAGE_SIZE)) || DOANHNGHIEP_UNG_VIEN_DETAIL_PAGE_SIZE, 1);
  const q = String(searchParams.get("q") || "").trim();
  const statusRaw = String(searchParams.get("status") || "").trim();
  const prismaAny = prisma as any;

  const job = await prismaAny.jobPost.findFirst({
    where: { id, enterpriseUserId: sub },
    select: {
      id: true,
      title: true,
      salary: true,
      expertise: true,
      experienceRequirement: true,
      workType: true,
      jobDescription: true,
      candidateRequirements: true,
      workLocation: true,
      workTime: true,
      benefits: true,
      applicationMethod: true,
      createdAt: true,
      deadlineAt: true,
      recruitmentCount: true,
      status: true
    }
  });
  if (!job) return NextResponse.json({ success: false, message: "Không tìm thấy tin tuyển dụng." }, { status: 404 });

  const allowedStatuses = new Set(["PENDING_REVIEW", "INTERVIEW_INVITED", "OFFERED", "REJECTED", "STUDENT_DECLINED"]);
  const status = allowedStatuses.has(statusRaw) ? statusRaw : "";
  const where: any = { jobPostId: id };
  if (status) where.status = status;
  if (q) {
    where.studentUser = {
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } }
      ]
    };
  }

  const [totalItems, apps] = await Promise.all([
    prismaAny.jobApplication.count({ where }),
    prismaAny.jobApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      status: true,
      coverLetter: true,
      cvPublicId: true,
      cvFileName: true,
      cvMime: true,
      interviewAt: true,
      response: true,
      responseAt: true,
      history: true,
      createdAt: true,
      studentUser: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          studentProfile: {
            select: {
              degree: true,
              internshipStatus: true,
              currentProvinceCode: true,
              currentProvinceName: true,
              currentWardCode: true,
              currentWardName: true,
              cvPublicId: true,
              cvFileName: true,
              cvMime: true
            }
          }
        }
      }
    }
  })
  ]);

  const now = new Date();

  // Resolve current address names when only codes exist (legacy data)
  const provinceNameByCode = new Map<string, string>();
  const wardNameByKey = new Map<string, string>(); // `${provinceCode}:${wardCode}` -> name
  const normalizeCode = (v: unknown) => String(v ?? "").trim();
  try {
    const needProvinceCodes = new Set<string>();
    for (const a of apps as any[]) {
      const sp = a?.studentUser?.studentProfile;
      const pCode = normalizeCode(sp?.currentProvinceCode);
      const wCode = normalizeCode(sp?.currentWardCode);
      const hasNames = Boolean(String(sp?.currentProvinceName || "").trim()) && Boolean(String(sp?.currentWardName || "").trim());
      if (!hasNames && pCode && wCode) needProvinceCodes.add(pCode);
    }
    if (needProvinceCodes.size) {
      const provinces = await fetchProvinceList();
      for (const p of provinces as any[]) {
        const code = normalizeCode(p?.code);
        const name = String(p?.name || "").trim();
        if (code && name) provinceNameByCode.set(code, name);
      }
      await Promise.all(
        Array.from(needProvinceCodes).map(async (pCode) => {
          try {
            const wards = await fetchWardsForProvince(pCode);
            for (const w of wards as any[]) {
              const wCode = normalizeCode(w?.code);
              const wName = String(w?.name || "").trim();
              if (wCode && wName) wardNameByKey.set(`${pCode}:${wCode}`, wName);
            }
          } catch {
            /* ignore */
          }
        })
      );
    }
  } catch {
    /* ignore */
  }

  // Lazy auto-decline: if responseDeadline passed and SV hasn't responded, mark as STUDENT_DECLINED
  const expiredIds: string[] = [];
  for (const a of apps) {
    if (
      (a.status === "INTERVIEW_INVITED" || a.status === "OFFERED") &&
      a.response === "PENDING"
    ) {
      const history = Array.isArray(a.history) ? a.history : [];
      const { responseDeadline } = extractHistoryMeta(history);
      if (responseDeadline) {
        const dl = new Date(responseDeadline);
        if (!Number.isNaN(dl.getTime()) && dl < now) {
          expiredIds.push(a.id);
        }
      }
    }
  }

  if (expiredIds.length) {
    const declineHistory = {
      at: now.toISOString(),
      by: "SYSTEM",
      action: "AUTO_DECLINED",
      reason: "Quá hạn phản hồi"
    };
    await Promise.all(
      expiredIds.map(async (appId: string) => {
        const app = apps.find((a: any) => a.id === appId);
        const prevHistory = Array.isArray(app?.history) ? app.history : [];
        await prismaAny.jobApplication.update({
          where: { id: appId },
          data: {
            status: "STUDENT_DECLINED",
            response: "DECLINED",
            responseAt: now,
            history: [...prevHistory, declineHistory]
          }
        });
        // Update the in-memory object for the response
        if (app) {
          app.status = "STUDENT_DECLINED";
          app.response = "DECLINED";
          app.responseAt = now;
          app.history = [...(Array.isArray(app.history) ? app.history : []), declineHistory];
        }
      })
    );
  }

  return NextResponse.json({
    success: true,
    page,
    pageSize,
    totalItems,
    job: {
      ...job,
      createdAt: job.createdAt?.toISOString?.() ?? null,
      deadlineAt: job.deadlineAt?.toISOString?.() ?? null
    },
    applicants: apps.map((a: any) => {
      const sp = a.studentUser?.studentProfile;
      const history = Array.isArray(a.history) ? a.history : [];
      const { responseDeadline, interviewLocation } = extractHistoryMeta(history);
      const provinceName =
        String(sp?.currentProvinceName || "").trim() ||
        (normalizeCode(sp?.currentProvinceCode) ? provinceNameByCode.get(normalizeCode(sp?.currentProvinceCode)) || "" : "");
      const wardName =
        String(sp?.currentWardName || "").trim() ||
        (() => {
          const pCode = normalizeCode(sp?.currentProvinceCode);
          const wCode = normalizeCode(sp?.currentWardCode);
          if (!pCode || !wCode) return "";
          return wardNameByKey.get(`${pCode}:${wCode}`) || "";
        })();
      const currentParts = [provinceName, wardName].filter(Boolean);

      // CV fallback: legacy apps may not store CV on JobApplication
      const effectiveCvPublicId = a.cvPublicId ?? sp?.cvPublicId ?? null;
      const effectiveCvFileName = a.cvFileName ?? sp?.cvFileName ?? null;
      const effectiveCvMime = a.cvMime ?? sp?.cvMime ?? null;
      return {
        id: a.id,
        appliedAt: a.createdAt?.toISOString?.() ?? null,
        status: a.status,
        coverLetter: a.coverLetter ?? null,
        cvPublicId: effectiveCvPublicId,
        cvFileName: effectiveCvFileName,
        cvMime: effectiveCvMime,
        interviewAt: a.interviewAt?.toISOString?.() ?? null,
        interviewLocation,
        responseDeadline,
        response: a.response,
        responseAt: a.responseAt?.toISOString?.() ?? null,
        history: a.history ?? null,
        internshipStatus: sp?.internshipStatus ?? "NOT_STARTED",
        student: {
          id: a.studentUser.id,
          fullName: a.studentUser.fullName,
          email: a.studentUser.email,
          phone: a.studentUser.phone ?? null,
          degree: sp?.degree ?? null,
          currentAddress: currentParts.length ? currentParts.join(" - ") : "—"
        }
      };
    })
  });
}
