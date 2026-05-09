import { NextResponse } from "next/server";
import { fetchWardsForProvince } from "@/lib/vn-open-api";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^\d+$/.test(code)) {
    return NextResponse.json({ message: "Mã tỉnh không hợp lệ." }, { status: 400 });
  }
  try {
    const wards = await fetchWardsForProvince(code);
    return NextResponse.json({ items: wards, wards });
  } catch {
    return NextResponse.json({ message: "Không tải được phường xã." }, { status: 502 });
  }
}
