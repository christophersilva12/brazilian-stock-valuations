/** Parses Fundamentus/B3 numeric strings such as "1.470.570,00", "7,05%" or "-2,33". */
export function parseBRNumber(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed || trimmed === "-" || trimmed === "–") return null;

  const negative = trimmed.startsWith("-") || trimmed.startsWith("(");
  const cleaned = trimmed.replace(/[()\s%]/g, "").replace(/^\+/, "");
  if (!cleaned || cleaned === "-") return null;

  const normalized = cleaned.replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return negative && value > 0 ? -value : value;
}
