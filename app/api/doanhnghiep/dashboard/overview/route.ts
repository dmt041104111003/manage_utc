import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE_NAME } from "@/lib/constants/auth/patterns";
import { prisma } from "@/lib/prisma";

async function getEnterpriseUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token)
    return { error: NextResponse.json({ success: false, message: "Vui lòng đăng nhập." }, { status: 401 }) };
  try {
    const verified = await verifySession(token);
    if (verified.role !== "doanhnghiep")
      return { error: NextResponse.json({ success: false, message: "Không có quyền truy cập." }, { status: 403 }) };
    return { userId: verified.sub as string };
  } catch {
    return { error: NextResponse.json({ success: false, message: "Phiên đăng nhập không hợp lệ." }, { status: 401 }) };
  }
}

type SimpleChartSeries = { name: string; data: number[]; color: string };

const CHART_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9", "#84cc16"];

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${m}/${y}`;
}

export async function GET(request: Request) {
  const auth = await getEnterpriseUserId();
  if ("error" in auth) return auth.error;
  const enterpriseUserId = auth.userId;
  const prismaAny = prisma as any;

  try {
    const { searchParams } = new URL(request.url);
    const dateFromParam = searchParams.get("dateFrom") ?? "";
    const dateToParam = searchParams.get("dateTo") ?? "";

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (dateFromParam) {
      const d = new Date(dateFromParam);
      if (!isNaN(d.getTime())) dateFilter.gte = d;
    }
    if (dateToParam) {
      const d = new Date(dateToParam);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        dateFilter.lte = d;
      }
    }

    const createdAtFilter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // --- Fetch all applications for this enterprise within date range ---
    const allApps: Array<{
      status: string;
      response: string;
      createdAt: Date;
      jobPost: { expertise: string | null };
      studentUser: { studentProfile: { faculty: string } | null } | null;
    }> = await prismaAny.jobApplication.findMany({
      where: {
        jobPost: { enterpriseUserId },
        ...createdAtFilter
      },
      select: {
        status: true,
        response: true,
        createdAt: true,
        jobPost: { select: { expertise: true } },
        studentUser: { select: { studentProfile: { select: { faculty: true } } } }
      }
    });

    // --- Fetch all job posts for this enterprise within date range ---
    const allPosts: Array<{ status: string; expertise: string | null; createdAt: Date }> =
      await prismaAny.jobPost.findMany({
        where: { enterpriseUserId, ...createdAtFilter },
        select: { status: true, expertise: true, createdAt: true }
      });

    // --- Double bar: accepted vs declined by expertise ---
    const acceptedByExpertise = new Map<string, number>();
    const declinedByExpertise = new Map<string, number>();
    for (const app of allApps) {
      const ex = app.jobPost?.expertise ?? "Khác";
      if (app.response === "ACCEPTED") {
        acceptedByExpertise.set(ex, (acceptedByExpertise.get(ex) ?? 0) + 1);
      }
      if (app.status === "STUDENT_DECLINED") {
        declinedByExpertise.set(ex, (declinedByExpertise.get(ex) ?? 0) + 1);
      }
    }
    const expertiseSet = new Set([...acceptedByExpertise.keys(), ...declinedByExpertise.keys()]);
    const doubleBarLabels = Array.from(expertiseSet).sort();
    const doubleBar = {
      labels: doubleBarLabels,
      accepted: doubleBarLabels.map((ex) => acceptedByExpertise.get(ex) ?? 0),
      declined: doubleBarLabels.map((ex) => declinedByExpertise.get(ex) ?? 0)
    };

    // --- Line chart: application count per expertise per month ---
    const monthKeysSet = new Set<string>();
    const appsByExpertiseMonth = new Map<string, Map<string, number>>();

    for (const app of allApps) {
      const ex = app.jobPost?.expertise ?? "Khác";
      const mk = app.createdAt ? monthKey(new Date(app.createdAt)) : null;
      if (!mk) continue;
      monthKeysSet.add(mk);
      if (!appsByExpertiseMonth.has(ex)) appsByExpertiseMonth.set(ex, new Map());
      const monthMap = appsByExpertiseMonth.get(ex)!;
      monthMap.set(mk, (monthMap.get(mk) ?? 0) + 1);
    }

    const sortedMonthKeys = Array.from(monthKeysSet).sort();
    const lastMonthKeys = sortedMonthKeys.length > 8 ? sortedMonthKeys.slice(-8) : sortedMonthKeys;

    // Top 5 expertise by total application count
    const expertiseTotals = Array.from(appsByExpertiseMonth.entries())
      .map(([ex, monthMap]) => ({ ex, total: Array.from(monthMap.values()).reduce((s, v) => s + v, 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const lineChartSeries: SimpleChartSeries[] = expertiseTotals.map(({ ex }, i) => {
      const monthMap = appsByExpertiseMonth.get(ex) ?? new Map<string, number>();
      return {
        name: ex,
        data: lastMonthKeys.map((mk) => monthMap.get(mk) ?? 0),
        color: CHART_COLORS[i % CHART_COLORS.length]
      };
    });

    const lineChart = {
      labels: lastMonthKeys.map(monthLabel),
      series: lineChartSeries
    };

    // --- Application status bar ---
    const appStatusCount: Record<string, number> = {
      PENDING_REVIEW: 0,
      INTERVIEW_INVITED: 0,
      OFFERED: 0,
      REJECTED: 0,
      STUDENT_DECLINED: 0
    };
    for (const app of allApps) {
      if (app.status in appStatusCount) appStatusCount[app.status]++;
    }
    const applicationStatus = {
      labels: ["Chờ xem xét", "Mời phỏng vấn", "Trúng tuyển", "Từ chối"],
      values: [
        appStatusCount.PENDING_REVIEW,
        appStatusCount.INTERVIEW_INVITED,
        appStatusCount.OFFERED,
        appStatusCount.REJECTED
      ]
    };

    // --- Job post status bar ---
    const postStatusCount: Record<string, number> = {
      PENDING: 0, REJECTED: 0, ACTIVE: 0, STOPPED: 0
    };
    for (const p of allPosts) {
      if (p.status in postStatusCount) postStatusCount[p.status]++;
    }
    const jobStatus = {
      labels: ["Chờ duyệt", "Từ chối duyệt", "Đang hoạt động", "Dừng hoạt động"],
      values: [
        postStatusCount.PENDING,
        postStatusCount.REJECTED,
        postStatusCount.ACTIVE,
        postStatusCount.STOPPED
      ]
    };

    return NextResponse.json({
      success: true,
      doubleBar,
      lineChart,
      applicationStatus,
      jobStatus
    });
  } catch (e) {
    console.error("[GET /api/doanhnghiep/dashboard/overview]", e);
    return NextResponse.json({ success: false, message: "Lỗi máy chủ." }, { status: 500 });
  }
}
