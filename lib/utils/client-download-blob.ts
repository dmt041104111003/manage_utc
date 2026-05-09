/**
 * Tải file qua fetch (credentials) rồi blob — ổn định hơn `<a href>` với API có cookie / lỗi mạng.
 * Chỉ gọi từ client.
 */
export async function downloadWithCredentials(
  url: string,
  filename: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: "include", cache: "no-store" });
  } catch {
    return { ok: false, message: "Không kết nối được máy chủ." };
  }
  if (!res.ok) {
    let message = `Lỗi ${res.status}`;
    try {
      const j = (await res.json()) as { message?: string };
      if (typeof j.message === "string" && j.message.trim()) message = j.message.trim();
    } catch {
      /* ignore */
    }
    return { ok: false, message };
  }
  let blob: Blob;
  try {
    blob = await res.blob();
  } catch {
    return { ok: false, message: "Không đọc được nội dung file." };
  }
  if (blob.size === 0) {
    return { ok: false, message: "File rỗng." };
  }
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename || "download";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
  return { ok: true };
}
