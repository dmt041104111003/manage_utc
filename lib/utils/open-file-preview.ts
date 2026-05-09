/**
 * Same-origin GET with cookies → blob URL → new tab (PDF/DOC xem inline ổn định hơn so với anchor + download).
 */
export async function openFilePreviewInNewTab(url: string): Promise<void> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`fetch_failed_${res.status}`);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const child = window.open(objectUrl, "_blank", "noopener,noreferrer");
  if (!child) {
    URL.revokeObjectURL(objectUrl);
    throw new Error("popup_blocked");
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 180_000);
}
