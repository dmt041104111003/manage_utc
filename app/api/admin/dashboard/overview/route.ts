import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

type OverviewFacultyValue = string;

type MonthLabel = string;

type DonutSegment = {
  label: string;
  value: number;
  percent: number; // 0..1
  color: string;
};

type SimpleChartSeries = {
  name: string;
  data: number[];
  color: string;
};

const DONUT_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9", "#84cc16"];

function monthKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  // key: yyyy-mm
  const [y, m] = key.split("-");
  return `${m}/${y}`;
}

function formatPercent(p: number) {
  return Math.round(p * 1000) / 10;
}

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const faculty = (searchParams.get("faculty") ?? "all").trim();
  const batchIdParam = (searchParams.get("batchId") ?? "all").trim();

  const prismaAny = prisma as any;

  const facultyRows: Array<{ faculty: string }> = await prismaAny.studentProfile.findMany({
    distinct: ["faculty"],
    select: { faculty: true }
  });
  const faculties = facultyRows.map((r) => r.faculty).filter(Boolean).sort();

  const batches: Array<{ id: string; name: string; status: string; startDate: Date }> = await prismaAny.internshipBatch.findMany({
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, status: true, startDate: true }
  });

  const openBatch = await prismaAny.internshipBatch.findFirst({
    where: { status: "OPEN" },
    orderBy: { startDate: "desc" },
    select: { id: true }
  });

  const chosenBatchId =
    batchIdParam && batchIdParam !== "all"
      ? batchIdParam
      : openBatch?.id ?? batches[0]?.id ?? null;

  if (!chosenBatchId) {
    return NextResponse.json({
      faculties,
      batches,
      selectedFaculty: faculty && faculty !== "all" ? faculty : "all",
      selectedBatchId: null,
      donut: { segments: [], total: 0 },
      enterprisesByField: { labels: [], values: [] },
      progress: { labels: [], values: [] },
      latestJobs: [],
      lineJobPosts: { labels: [], series: [] },
      topFields: { top: [], bottom: [] }
    });
  }

  const selectedFaculty: OverviewFacultyValue = faculty && faculty !== "all" ? faculty : "all";

  // --- Accepted offers in chosen batch (enterprise linked) ---
  const acceptedJobApplications: any[] = await prismaAny.jobApplication.findMany({
    where: {
      response: "ACCEPTED",
      jobPost: { internshipBatchId: chosenBatchId }
    },
    select: {
      id: true,
      createdAt: true,
      responseAt: true,
      studentUserId: true,
      jobPost: {
        select: {
          enterpriseUserId: true,
          expertise: true,
          enterpriseUser: {
            select: { companyName: true }
          }
        }
      },
      studentUser: {
        select: {
          studentProfile: { select: { internshipStatus: true, faculty: true } }
        }
      }
    }
  });

  const acceptedFiltered = selectedFaculty === "all"
    ? acceptedJobApplications
    : acceptedJobApplications.filter(
        (row) => row.studentUser?.studentProfile?.faculty === selectedFaculty
      );

  // Deduplicate by studentUserId to avoid multi-accept counting.
  const byStudent = new Map<string, any>();
  for (const row of acceptedFiltered) {
    const key = String(row.studentUserId);
    const existing = byStudent.get(key);
    if (!existing) {
      byStudent.set(key, row);
      continue;
    }
    // Keep the latest createdAt per student.
    const exT = existing.createdAt ? new Date(existing.createdAt).getTime() : 0;
    const rT = row.createdAt ? new Date(row.createdAt).getTime() : 0;
    if (rT >= exT) byStudent.set(key, row);
  }
  const acceptedByStudent = Array.from(byStudent.values());

  const statusDone = new Set(["DOING", "REPORT_SUBMITTED", "COMPLETED"]);
  const statusExcludeSelf = "SELF_FINANCED";

  // --- Donut: internship rate distribution (excluding self-financed) by enterprise ---
  const doneCountsByEnterprise = new Map<string, number>();
  const enterpriseNameById = new Map<string, string>();

  for (const row of acceptedByStudent) {
    const studentProfile = row.studentUser?.studentProfile;
    const internshipStatus = studentProfile?.internshipStatus;
    const enterpriseId = String(row.jobPost.enterpriseUserId);
    const enterpriseName = row.jobPost.enterpriseUser?.companyName ?? `Doanh nghiệp ${enterpriseId}`;
    enterpriseNameById.set(enterpriseId, enterpriseName);

    if (!internshipStatus || internshipStatus === statusExcludeSelf) continue;
    if (!statusDone.has(internshipStatus)) continue;

    doneCountsByEnterprise.set(enterpriseId, (doneCountsByEnterprise.get(enterpriseId) ?? 0) + 1);
  }

  const doneEntries = Array.from(doneCountsByEnterprise.entries())
    .map(([enterpriseId, value]) => ({ enterpriseId, value, label: enterpriseNameById.get(enterpriseId) ?? enterpriseId }))
    .sort((a, b) => b.value - a.value);

  const donutTopN = 5;
  const totalDone = doneEntries.reduce((sum, it) => sum + it.value, 0);
  const donutSegmentsRaw = doneEntries.slice(0, donutTopN).map((it) => ({ label: it.label, value: it.value }));
  const otherValue = doneEntries.slice(donutTopN).reduce((sum, it) => sum + it.value, 0);
  if (otherValue > 0) donutSegmentsRaw.push({ label: "Khác", value: otherValue });

  const donutSegments: DonutSegment[] = donutSegmentsRaw.map((seg, idx) => {
    const percent = totalDone === 0 ? 0 : seg.value / totalDone;
    return {
      label: seg.label,
      value: seg.value,
      percent,
      color: DONUT_COLORS[idx % DONUT_COLORS.length]
    };
  });

  // --- Bar: enterprise linked count by field (expertise) ---
  const enterprisesSetByExpertise = new Map<string, Set<string>>();
  for (const row of acceptedByStudent) {
    const expertise = row.jobPost.expertise ?? "Khác";
    const enterpriseId = String(row.jobPost.enterpriseUserId);
    if (!enterprisesSetByExpertise.has(expertise)) enterprisesSetByExpertise.set(expertise, new Set());
    enterprisesSetByExpertise.get(expertise)!.add(enterpriseId);
  }
  const enterprisesByFieldRaw = Array.from(enterprisesSetByExpertise.entries())
    .map(([expertise, set]) => ({ expertise, value: set.size }))
    .sort((a, b) => b.value - a.value);

  // Keep it readable
  const enterprisesByField = enterprisesByFieldRaw.slice(0, 12);

  // --- Column: internship progress counts by status ---
  const uniqueStudentsByStatus = new Map<string, number>();
  for (const row of acceptedByStudent) {
    const internshipStatus = row.studentUser?.studentProfile?.internshipStatus;
    if (!internshipStatus) continue;
    uniqueStudentsByStatus.set(internshipStatus, (uniqueStudentsByStatus.get(internshipStatus) ?? 0) + 1);
  }
  const statusOrder = ["NOT_STARTED", "DOING", "SELF_FINANCED", "REPORT_SUBMITTED", "COMPLETED", "REJECTED"];
  const statusLabel: Record<string, string> = {
    NOT_STARTED: "Chưa thực tập",
    DOING: "Đang thực tập",
    SELF_FINANCED: "Thực tập tự túc",
    REPORT_SUBMITTED: "Đã nộp BCTT",
    COMPLETED: "Hoàn thành",
    REJECTED: "Từ chối"
  };
  const progress = {
    labels: statusOrder.map((s) => statusLabel[s] ?? s),
    values: statusOrder.map((s) => uniqueStudentsByStatus.get(s) ?? 0)
  };

  // --- Latest recruitment posts ---
  const latestJobsRows: any[] = await prismaAny.jobPost.findMany({
    where: {
      internshipBatchId: chosenBatchId,
      status: { in: ["ACTIVE", "PENDING"] }
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      createdAt: true,
      deadlineAt: true,
      recruitmentCount: true,
      expertise: true,
      enterpriseUser: { select: { companyName: true, taxCode: true } },
      internshipBatch: { select: { name: true } }
    }
  });

  const latestJobs = latestJobsRows.map((r) => ({
    id: r.id,
    title: r.title,
    enterpriseName: r.enterpriseUser?.companyName ?? null,
    batchName: r.internshipBatch?.name ?? null,
    createdAt: r.createdAt?.toISOString?.() ?? null,
    deadlineAt: r.deadlineAt?.toISOString?.() ?? null,
    recruitmentCount: r.recruitmentCount,
    expertise: r.expertise,
    taxCode: r.enterpriseUser?.taxCode ?? null
  }));

  // --- Line: job posts cumulative by month for top enterprises ---
  const jobPostsInBatch: any[] = await prismaAny.jobPost.findMany({
    where: { internshipBatchId: chosenBatchId },
    select: {
      enterpriseUserId: true,
      createdAt: true,
      enterpriseUser: { select: { companyName: true } }
    }
  });

  const postsCountByEnterprise = new Map<string, number>();
  const enterpriseNameById2 = new Map<string, string>();
  const monthKeysSet = new Set<string>();

  for (const jp of jobPostsInBatch) {
    const enterpriseId = String(jp.enterpriseUserId);
    postsCountByEnterprise.set(enterpriseId, (postsCountByEnterprise.get(enterpriseId) ?? 0) + 1);
    enterpriseNameById2.set(enterpriseId, jp.enterpriseUser?.companyName ?? enterpriseId);
    if (jp.createdAt) monthKeysSet.add(monthKey(new Date(jp.createdAt)));
  }

  const monthKeys = Array.from(monthKeysSet).sort(); // asc by yyyy-mm
  const lastMonthKeys = monthKeys.length > 8 ? monthKeys.slice(-8) : monthKeys;

  // Prepare month cumulative per enterprise
  const selectedEnterprises = Array.from(postsCountByEnterprise.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([enterpriseId]) => enterpriseId);

  const series: SimpleChartSeries[] = selectedEnterprises.map((enterpriseId, i) => {
    const color = DONUT_COLORS[(i + 1) % DONUT_COLORS.length];
    const points = lastMonthKeys.map(() => 0);
    // Count cumulative
    for (const jp of jobPostsInBatch) {
      const eId = String(jp.enterpriseUserId);
      if (eId !== enterpriseId) continue;
      const mk = jp.createdAt ? monthKey(new Date(jp.createdAt)) : null;
      if (!mk) continue;
      const idx = lastMonthKeys.indexOf(mk);
      if (idx < 0) continue;
      for (let j = idx; j < lastMonthKeys.length; j++) points[j] += 1;
    }
    return { name: enterpriseNameById2.get(enterpriseId) ?? enterpriseId, data: points, color };
  });

  const lineJobPosts = {
    labels: lastMonthKeys.map(monthLabel),
    series
  };

  // --- Top fields by application count (top/bottom 5 by non-zero) ---
  const jobApplicationsForFields: any[] = await prismaAny.jobApplication.findMany({
    where: {
      jobPost: { internshipBatchId: chosenBatchId },
      // lọc khoa ở phía JS để tránh ràng buộc nested relation không chắc chắn
    },
    select: {
      id: true,
      jobPost: { select: { expertise: true } },
      studentUser: { select: { studentProfile: { select: { faculty: true } } } }
    }
  });

  const countByField = new Map<string, number>();
  for (const app of jobApplicationsForFields) {
    if (selectedFaculty !== "all" && app.studentUser?.studentProfile?.faculty !== selectedFaculty) continue;
    const field = app.jobPost?.expertise ?? "Khác";
    countByField.set(field, (countByField.get(field) ?? 0) + 1);
  }
  const byField = Array.from(countByField.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const top = byField.slice(0, 5);
  const bottomNonZero = byField.filter((x) => x.count > 0).sort((a, b) => a.count - b.count);
  const bottom = bottomNonZero.slice(0, 5);

  return NextResponse.json({
    faculties,
    batches: batches.map((b) => ({ id: b.id, name: b.name, status: b.status })),
    selectedFaculty,
    selectedBatchId: chosenBatchId,
    donut: { segments: donutSegments, total: totalDone, totalPercentText: formatPercent(totalDone === 0 ? 0 : 1) },
    enterprisesByField: {
      labels: enterprisesByField.map((x) => x.expertise),
      values: enterprisesByField.map((x) => x.value)
    },
    progress,
    latestJobs,
    lineJobPosts,
    topFields: { top, bottom }
  });
}

