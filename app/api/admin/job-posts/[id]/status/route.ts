import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { getPublicAppUrl } from "@/lib/mail-enterprise";

type JobStatus = "PENDING" | "REJECTED" | "ACTIVE" | "STOPPED";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ message: "Không có quyền truy cập." }, { status: 403 });

  const { id } = await ctx.params;
  const body = (await request.json()) as {
    action?: "approve" | "reject" | "stop";
    rejectionReason?: string;
  };

  const action = body.action;
  const rejectionReason = (body.rejectionReason || "").trim();

  const job = await (prisma as any).jobPost.findFirst({
    where: { id },
    select: {
      id: true,
      title: true,
      status: true,
      expertise: true,
      enterpriseUser: { select: { email: true, companyName: true } }
    }
  });
  if (!job) return NextResponse.json({ success: false, message: "Không tìm thấy tin tuyển dụng." }, { status: 404 });

  let nextStatus: JobStatus = "PENDING";
  let nextRejectionReason: string | null = null;
  const now = new Date();

  if (action === "approve") {
    nextStatus = "ACTIVE";
  } else if (action === "reject") {
    if (!rejectionReason) {
      return NextResponse.json({ success: false, field: "rejectionReason", message: "Lý do từ chối là bắt buộc." }, { status: 400 });
    }
    nextStatus = "REJECTED";
    nextRejectionReason = rejectionReason;
  } else if (action === "stop") {
    nextStatus = "STOPPED";
    nextRejectionReason = null;
  } else {
    return NextResponse.json({ success: false, message: "Thiếu hành động hợp lệ." }, { status: 400 });
  }

  try {
    await (prisma as any).jobPost.update({
      where: { id },
      data: {
        status: nextStatus,
        rejectionReason: nextRejectionReason,
        ...(nextStatus === "STOPPED" ? { stoppedAt: now } : {})
      }
    });
  } catch (e) {
    console.error("[PATCH /api/admin/job-posts/[id]/status] update error", e);
    return NextResponse.json({ success: false, message: "Lỗi máy chủ khi cập nhật trạng thái." }, { status: 500 });
  }

  // Send email notification to enterprise
  try {
    const appUrl = getPublicAppUrl();
    const enterpriseEmail: string | null = job.enterpriseUser?.email ?? null;
    const companyName: string = job.enterpriseUser?.companyName ?? "Doanh nghiệp";
    const jobTitle: string = job.title ?? "Tin tuyển dụng";
    const expertiseLine = job.expertise ? `\n  Lĩnh vực: ${job.expertise}` : "";

    if (enterpriseEmail) {
      if (action === "approve") {
        await sendMail(
          enterpriseEmail,
          `[UTC] Tin tuyển dụng đã được phê duyệt – ${jobTitle}`,
          `Kính gửi ${companyName},\n\nTin tuyển dụng "${jobTitle}" của quý doanh nghiệp đã được Admin phê duyệt và hiện đang hoạt động trên hệ thống.${expertiseLine}\n\nQuý doanh nghiệp có thể đăng nhập để xem và quản lý danh sách ứng viên.\nĐường dẫn hệ thống: ${appUrl}/doanhnghiep\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
        );
      } else if (action === "reject") {
        await sendMail(
          enterpriseEmail,
          `[UTC] Tin tuyển dụng bị từ chối duyệt – ${jobTitle}`,
          `Kính gửi ${companyName},\n\nTin tuyển dụng "${jobTitle}" của quý doanh nghiệp đã bị từ chối duyệt.${expertiseLine}\n\nLý do: ${rejectionReason}\n\nQuý doanh nghiệp vui lòng chỉnh sửa và đăng lại theo hướng dẫn.\nĐường dẫn hệ thống: ${appUrl}/doanhnghiep\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
        );
      } else if (action === "stop") {
        await sendMail(
          enterpriseEmail,
          `[UTC] Tin tuyển dụng đã dừng hoạt động – ${jobTitle}`,
          `Kính gửi ${companyName},\n\nTin tuyển dụng "${jobTitle}" của quý doanh nghiệp đã được Admin dừng hoạt động trên hệ thống.${expertiseLine}\n\nNếu có thắc mắc, vui lòng liên hệ bộ phận quản lý.\nĐường dẫn hệ thống: ${appUrl}/doanhnghiep\n\nTrân trọng,\nHệ thống quản lý thực tập UTC`
        );
      }
    }
  } catch {
    // Email failure must not block the main response
  }

  return NextResponse.json({ success: true, message: "Cập nhật trạng thái tin tuyển dụng thành công." });
}
