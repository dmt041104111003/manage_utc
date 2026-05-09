import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import { buildEnterpriseHeadquartersAddress, formatBusinessFields } from "@/lib/utils/enterprise-admin-display";

function enterpriseMetaAsRecord(meta: unknown): Record<string, unknown> {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  return meta as Record<string, unknown>;
}

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  try {
    const { id } = await ctx.params;
    const now = new Date();

    try {
      await (prisma as any).jobPost.updateMany({
        where: {
          deadlineAt: { lt: now },
          status: { in: ["PENDING", "REJECTED", "ACTIVE"] }
        },
        data: { status: "STOPPED", stoppedAt: now }
      });
    } catch {
    }

    const job = await (prisma as any).jobPost.findFirst({
      where: { id },
      include: {
        enterpriseUser: { select: { companyName: true, taxCode: true, enterpriseMeta: true } },
        internshipBatch: { select: { id: true, name: true } }
      }
    });

    if (!job) return NextResponse.json({ success: false, message: "Không tìm thấy tin tuyển dụng." }, { status: 404 });

    const meta = enterpriseMetaAsRecord(job.enterpriseUser?.enterpriseMeta);
    const businessFields = formatBusinessFields(job.enterpriseUser?.enterpriseMeta);
    const headquartersAddress = buildEnterpriseHeadquartersAddress(job.enterpriseUser?.enterpriseMeta);
    const intro = job.companyIntro ?? (typeof meta.businessFields !== "undefined" ? businessFields : null);
    const website = job.companyWebsite ?? (typeof meta.website === "string" && meta.website.trim() ? meta.website.trim() : null);

    return NextResponse.json({
      success: true,
      item: {
        job: {
          id: job.id,
          title: job.title,
          createdAt: job.createdAt?.toISOString?.() ?? null,
          recruitmentCount: job.recruitmentCount,
          expertise: job.expertise,
          workType: job.workType,
          status: job.status,
          deadlineAt: job.deadlineAt?.toISOString?.() ?? null,
          salary: job.salary,
          experienceRequirement: job.experienceRequirement,
          jobDescription: job.jobDescription,
          candidateRequirements: job.candidateRequirements,
          benefits: job.benefits,
          workLocation: job.workLocation,
          workTime: job.workTime,
          applicationMethod: job.applicationMethod,
          companyIntro: intro,
          companyWebsite: website,
          rejectionReason: job.rejectionReason ?? null
        },
        enterprise: {
          companyName: job.enterpriseUser?.companyName ?? null,
          taxCode: job.enterpriseUser?.taxCode ?? null,
          businessFields,
          headquartersAddress
        },
        batch: {
          id: job.internshipBatch?.id ?? null,
          name: job.internshipBatch?.name ?? null
        }
      }
    });
  } catch (e) {
    console.error("[GET /api/admin/job-posts/[id]]", e);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;

  const linkedCount = await (prisma as any).jobApplication.count({ where: { jobPostId: id } });
  if (linkedCount > 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Không thể xóa Tin tuyển dụng đã có dữ liệu liên kết trong hệ thống."
      },
      { status: 409 }
    );
  }

  await (prisma as any).jobPost.delete({ where: { id } });

  return NextResponse.json({ success: true, message: "Xóa tin tuyển dụng thành công" });
}

