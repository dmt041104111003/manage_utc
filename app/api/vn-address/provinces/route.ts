import { NextResponse } from "next/server";
import { fetchProvinceList } from "@/lib/vn-open-api";

export async function GET() {
  try {
    const provinces = await fetchProvinceList();
    return NextResponse.json({ provinces });
  } catch {
    return NextResponse.json({ message: "Không tải được danh mục tỉnh thành." }, { status: 502 });
  }
}
