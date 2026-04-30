// src/lib/color-palette.ts

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s / 100) * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const GOLDEN_ANGLE = 137.508;

export const COLOR_PALETTE: readonly string[] = Array.from(
  { length: 100 },
  (_, i) => hslToHex((i * GOLDEN_ANGLE) % 360, 70, 55)
);

export function pickNextColor(used: readonly (string | null)[]): string {
  const usedSet = new Set(
    used.filter((c): c is string => !!c).map((c) => c.toLowerCase())
  );
  for (const color of COLOR_PALETTE) {
    if (!usedSet.has(color.toLowerCase())) return color;
  }
  return COLOR_PALETTE[used.length % COLOR_PALETTE.length];
}
