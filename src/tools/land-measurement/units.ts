export interface ThaiLandUnits { rai: number; ngan: number; squareWa: number; }

export function formatMeters(meters: number, locale = 'th-TH'): string {
  if (meters >= 1000) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(meters / 1000)} km`;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(meters)} m`;
}

export function toThaiLandUnits(squareMeters: number): ThaiLandUnits {
  const safe = Math.max(0, squareMeters); const rai = Math.floor(safe / 1600); const remainderAfterRai = safe - rai * 1600; const ngan = Math.floor(remainderAfterRai / 400); const squareWa = (remainderAfterRai - ngan * 400) / 4;
  return { rai, ngan, squareWa };
}

export function formatThaiLandUnits(squareMeters: number, locale = 'th-TH'): string {
  const units = toThaiLandUnits(squareMeters); const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return `${number.format(units.rai)} ไร่ ${number.format(units.ngan)} งาน ${number.format(units.squareWa)} ตร.ว.`;
}

export function formatArea(squareMeters: number, locale = 'th-TH'): string {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return `${number.format(squareMeters)} m² · ${formatThaiLandUnits(squareMeters, locale)} · ${number.format(squareMeters / 10_000)} ha · ${number.format(squareMeters / 4_046.8564224)} acres`;
}
