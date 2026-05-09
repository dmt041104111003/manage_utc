/** Hex #RGB / #RRGGBB → rgba(..., alpha) */
export function withAlpha(hex: string, alpha: number): string {
  const raw = hex.trim().replace("#", "");
  if (raw.length !== 3 && raw.length !== 6) return hex;
  const v = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const num = parseInt(v, 16);
  if (Number.isNaN(num)) return hex;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r},${g},${b},${a})`;
}

/** Làm tối hex #RGB / #RRGGBB (0–1) để gradient Recharts */
export function darkenHex(hex: string, amount = 0.22): string {
  const raw = hex.trim().replace("#", "");
  if (raw.length !== 3 && raw.length !== 6) return hex;
  const v = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const num = parseInt(v, 16);
  if (Number.isNaN(num)) return hex;
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.max(0, Math.min(255, Math.round(r * (1 - amount))));
  g = Math.max(0, Math.min(255, Math.round(g * (1 - amount))));
  b = Math.max(0, Math.min(255, Math.round(b * (1 - amount))));
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
