function parseFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const star = header.match(/filename\*=UTF-8''([^;\s]+)/i);
  if (star?.[1]) {
    try {
      const n = decodeURIComponent(star[1].trim());
      return n || null;
    } catch {
      /* ignore */
    }
  }
  const q = header.match(/filename="((?:\\.|[^"\\])*)"/i);
  if (q?.[1]) return q[1].replace(/\\"/g, '"').trim() || null;
  const plain = header.match(/filename=([^;\s]+)/i);
  if (plain?.[1]) return plain[1].replace(/^["']|["']$/g, "").trim() || null;
  return null;
}

/**
 * Tải file qua fetch (credentials) rồi blob — ổn định hơn `<a href>` với API có cookie / lỗi mạng.
 * Chỉ gọi từ client.
 */
export async function downloadWithCredentials(
  url: string,
  filenameFallback: string
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
  const fromServer = parseFilenameFromContentDisposition(res.headers.get("Content-Disposition"));
  const downloadName = fromServer || filenameFallback || "download";
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = downloadName;
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
  return { ok: true };
}
