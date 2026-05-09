import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

type DonutSegment = { label: string; value: number; percent: number; color: string };
type SimpleChartSeries = { name: string; data: number[]; color: string };

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9", "#84cc16", "#f97316"];

function mkDonutSegments(
  entries: Array<{ label: string; value: number }>,
  colors: string[]
): { segments: DonutSegment[]; total: number } {
  const total = entries.reduce((s, e) => s + e.value, 0);
  const segments: DonutSegment[] = entries.map((e, i) => ({
    label: e.label,
    value: e.value,
    percent: total === 0 ? 0 : e.value / total,
    color: colors[i % colors.length]
  }));
  return { segments, total };
}

function monthKey(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${m}/${y}`;
}

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const faculty = (searchParams.get("faculty") ?? "all").trim();
    const batchIdParam = (searchParams.get("batchId") ?? "all").trim();
    const prismaAny = prisma as any;

    // --- Meta: faculties, batches ---
    const facultyRows: Array<{ faculty: string }> = await prismaAny.studentProfile.findMany({
      distinct: ["faculty"],
      select: { faculty: true }
    });
    const faculties = facultyRows.map((r) => r.faculty).filter(Boolean).sort() as string[];

    const batches: Array<{ id: string; name: string; status: string; startDate: Date }> =
      await prismaAny.internshipBatch.findMany({
        orderBy: { startDate: "desc" },
        select: { id: true, name: true, status: true, startDate: true }
      });

    const openBatch: { id: string } | null = await prismaAny.internshipBatch.findFirst({
      where: { status: "OPEN" },
      orderBy: { startDate: "desc" },
      select: { id: true }
    });

    const chosenBatchId =
      batchIdParam !== "all" ? batchIdParam : openBatch?.id ?? batches[0]?.id ?? null;

    const selectedFaculty = faculty !== "all" ? faculty : "all";

    const emptyResponse = {
      faculties,
      batches: batches.map((b) => ({ id: b.id, name: b.name, status: b.status })),
      selectedFaculty,
      selectedBatchId: null,
      applicationStatusDonut: { segments: [], total: 0 },
      jobStatusDonut: { segments: [], total: 0 },
      enterprisesByField: { labels: [], values: [] },
      progress: { labels: [], values: [] },
      lineJobPosts: { labels: [], series: [] },
      topFaculties: { top: [], bottom: [] }
    };

    if (!chosenBatchId) return NextResponse.json(emptyResponse);

    // --- Donut 1: Application status breakdown ---
    const facultyFilter =
      selectedFaculty !== "all"
        ? { studentUser: { studentProfile: { faculty: selectedFaculty } } }
        : {};

    const allApps: Array<{ status: string; response: string }> =
      await prismaAny.jobApplication.findMany({
        where: { jobPost: { internshipBatchId: chosenBatchId }, ...facultyFilter },
        select: { status: true, response: true }
      });

    let pendingCount = 0, acceptedCount = 0, svDeclinedCount = 0, dnDeclinedCount = 0;
    for (const app of allApps) {
      if (app.status === "REJECTED") dnDeclinedCount++;
      else if (app.status === "STUDENT_DECLINED") svDeclinedCount++;
      else if (app.response === "ACCEPTED") acceptedCount++;
      else pendingCount++;
    }

    const applicationStatusDonut = mkDonutSegments(
      [
        { label: "Chờ xem xét", value: pendingCount },
        { label: "SV chấp nhận thực tập", value: acceptedCount },
        { label: "SV từ chối", value: svDeclinedCount },
        { label: "DN từ chối", value: dnDeclinedCount }
      ],
      ["#2563eb", "#16a34a", "#f59e0b", "#ef4444"]
    );

    // --- Donut 2: Job post status breakdown ---
    const jobPostStatusRows: Array<{ status: string }> = await prismaAny.jobPost.findMany({
      where: { internshipBatchId: chosenBatchId },
      select: { status: true }
    });
    const jpCount: Record<string, number> = { PENDING: 0, REJECTED: 0, ACTIVE: 0, STOPPED: 0 };
    for (const jp of jobPostStatusRows) {
      if (jp.status in jpCount) jpCount[jp.status]++;
    }
    const jobStatusDonut = mkDonutSegments(
      [
        { label: "Chờ duyệt", value: jpCount.PENDING },
        { label: "Từ chối", value: jpCount.REJECTED },
        { label: "Đang hoạt động", value: jpCount.ACTIVE },
        { label: "Dừng hoạt động", value: jpCount.STOPPED }
      ],
      ["#f59e0b", "#ef4444", "#16a34a", "#6b7280"]
    );

    // --- Bar: Enterprise count by expertise ---
    const jobPostsForExpertise: Array<{ enterpriseUserId: string; expertise: string }> =
      await prismaAny.jobPost.findMany({
        where: { internshipBatchId: chosenBatchId },
        select: { enterpriseUserId: true, expertise: true }
      });
    const enterprisesByExpertise = new Map<string, Set<string>>();
    for (const jp of jobPostsForExpertise) {
      const ex = jp.expertise ?? "Khác";
      if (!enterprisesByExpertise.has(ex)) enterprisesByExpertise.set(ex, new Set());
      enterprisesByExpertise.get(ex)!.add(String(jp.enterpriseUserId));
    }
    const enterprisesByFieldArr = Array.from(enterprisesByExpertise.entries())
      .map(([expertise, set]) => ({ expertise, value: set.size }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 12);
    const enterprisesByField = {
      labels: enterprisesByFieldArr.map((x) => x.expertise),
      values: enterprisesByFieldArr.map((x) => x.value)
    };

    // --- Bar: Internship progress (ALL students, filtered by faculty) ---
    const studentProgressRows: Array<{ internshipStatus: string }> =
      await prismaAny.studentProfile.findMany({
        where: selectedFaculty !== "all" ? { faculty: selectedFaculty } : {},
        select: { internshipStatus: true }
      });
    const STATUS_ORDER = [
      "NOT_STARTED", "DOING", "SELF_FINANCED", "REPORT_SUBMITTED", "COMPLETED", "REJECTED"
    ];
    const STATUS_LABELS: Record<string, string> = {
      NOT_STARTED: "Chưa thực tập",
      DOING: "Đang thực tập",
      SELF_FINANCED: "Thực tập tự túc",
      REPORT_SUBMITTED: "Đã nộp BCTT",
      COMPLETED: "Hoàn thành",
      REJECTED: "Từ chối"
    };
    const progressCounts: Record<string, number> = {};
    for (const row of studentProgressRows) {
      progressCounts[row.internshipStatus] = (progressCounts[row.internshipStatus] ?? 0) + 1;
    }
    const progress = {
      labels: STATUS_ORDER.map((s) => STATUS_LABELS[s] ?? s),
      values: STATUS_ORDER.map((s) => progressCounts[s] ?? 0)
    };

    // --- Line: cumulative job posts by top enterprises ---
    const jobPostsInBatch: Array<{
      enterpriseUserId: string;
      createdAt: Date;
      enterpriseUser: { companyName: string | null };
    }> = await prismaAny.jobPost.findMany({
      where: { internshipBatchId: chosenBatchId },
      select: {
        enterpriseUserId: true,
        createdAt: true,
        enterpriseUser: { select: { companyName: true } }
      }
    });

    const postsCountByEnterprise = new Map<string, number>();
    const enterpriseNameById = new Map<string, string>();
    const monthKeysSet = new Set<string>();

    for (const jp of jobPostsInBatch) {
      const eId = String(jp.enterpriseUserId);
      postsCountByEnterprise.set(eId, (postsCountByEnterprise.get(eId) ?? 0) + 1);
      enterpriseNameById.set(eId, jp.enterpriseUser?.companyName ?? eId);
      if (jp.createdAt) monthKeysSet.add(monthKey(new Date(jp.createdAt)));
    }

    const monthKeys = Array.from(monthKeysSet).sort();
    const lastMonthKeys = monthKeys.length > 8 ? monthKeys.slice(-8) : monthKeys;

    const topEnterprises = Array.from(postsCountByEnterprise.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([eId]) => eId);

    const lineJobPostsSeries: SimpleChartSeries[] = topEnterprises.map((eId, i) => {
      const color = COLORS[(i + 1) % COLORS.length];
      const points = lastMonthKeys.map(() => 0);
      for (const jp of jobPostsInBatch) {
        if (String(jp.enterpriseUserId) !== eId) continue;
        const mk = jp.createdAt ? monthKey(new Date(jp.createdAt)) : null;
        if (!mk) continue;
        const idx = lastMonthKeys.indexOf(mk);
        if (idx < 0) continue;
        for (let j = idx; j < lastMonthKeys.length; j++) points[j] += 1;
      }
      return { name: enterpriseNameById.get(eId) ?? eId, data: points, color };
    });

    const lineJobPosts = {
      labels: lastMonthKeys.map(monthLabel),
      series: lineJobPostsSeries
    };

    // --- Top/Bottom 5 faculties by application & offer count ---
    const appsByFaculty: Array<{
      response: string;
      studentUser: { studentProfile: { faculty: string } | null } | null;
    }> = await prismaAny.jobApplication.findMany({
      where: { jobPost: { internshipBatchId: chosenBatchId } },
      select: {
        response: true,
        studentUser: { select: { studentProfile: { select: { faculty: true } } } }
      }
    });

    const facultyStats = new Map<string, { applications: number; offered: number }>();
    for (const app of appsByFaculty) {
      const f = app.studentUser?.studentProfile?.faculty ?? "Không rõ";
      if (!facultyStats.has(f)) facultyStats.set(f, { applications: 0, offered: 0 });
      const stat = facultyStats.get(f)!;
      stat.applications++;
      if (app.response === "ACCEPTED") stat.offered++;
    }

    const facultyArr = Array.from(facultyStats.entries())
      .map(([label, { applications, offered }]) => ({ label, applications, offered }))
      .sort((a, b) => b.applications - a.applications);

    const topFaculties = {
      top: facultyArr.slice(0, 5),
      bottom: [...facultyArr].sort((a, b) => a.applications - b.applications).slice(0, 5)
    };

    return NextResponse.json({
      faculties,
      batches: batches.map((b) => ({ id: b.id, name: b.name, status: b.status })),
      selectedFaculty,
      selectedBatchId: chosenBatchId,
      applicationStatusDonut,
      jobStatusDonut,
      enterprisesByField,
      progress,
      lineJobPosts,
      topFaculties
    });
  } catch (e) {
    console.error("[GET /api/admin/dashboard/overview]", e);
    return NextResponse.json({ success: false, message: "Lỗi máy chủ." }, { status: 500 });
  }
}
