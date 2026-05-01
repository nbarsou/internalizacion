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

export function pickNextColor(
  used: readonly (string | null)[],
  offset: number = 0 // Added offset parameter, defaulting to 0
): string {
  const usedSet = new Set(
    used.filter((c): c is string => !!c).map((c) => c.toLowerCase())
  );

  const paletteLen = COLOR_PALETTE.length;

  // Safely handle negative offsets and ensure it's an integer
  const safeOffset =
    ((Math.trunc(offset) % paletteLen) + paletteLen) % paletteLen;

  // Start checking from the offset index instead of 0
  for (let i = 0; i < paletteLen; i++) {
    const colorIndex = (i + safeOffset) % paletteLen;
    const color = COLOR_PALETTE[colorIndex];

    if (!usedSet.has(color.toLowerCase())) {
      return color;
    }
  }

  // Apply offset to the fallback as well
  return COLOR_PALETTE[(used.length + safeOffset) % paletteLen];
}
