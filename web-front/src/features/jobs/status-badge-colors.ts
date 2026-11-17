import type { CSSProperties } from 'react';
import { HEX_COLOR_PATTERN } from '@job-tracker/shared';

const FALLBACK = '#4a6088';

/** Resolves a stored colour to a hex accent, falling back to slate. */
export function resolveAccentHex(value: string): string {
  return HEX_COLOR_PATTERN.test(value) ? value : FALLBACK;
}

function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * A status colour is stored as a single accent hex. The badge needs four roles
 * (fill, border, text, dot), so the pale fill, border and dark readable text are
 * derived from the accent's hue/saturation at fixed lightnesses — the accent
 * itself is the dot. Saturation is clamped so a neon pick still reads calmly and
 * the text keeps contrast on the light fill. Applied via inline style because it
 * is computed per row from user data, not a static class.
 */
export function statusBadgeStyle(hex: string): {
  badge: CSSProperties;
  dot: CSSProperties;
} {
  const accent = resolveAccentHex(hex);
  const [h, s] = hexToHsl(accent);
  const tint = (lightness: number) =>
    `hsl(${h} ${Math.min(s, 55)}% ${lightness}%)`;
  const ink = (lightness: number) =>
    `hsl(${h} ${Math.min(s, 60)}% ${lightness}%)`;
  // light-dark() follows the theme's color-scheme: a dark tint with light text under `.dark`.
  return {
    badge: {
      backgroundColor: `light-dark(${tint(94)}, ${tint(18)})`,
      borderColor: `light-dark(${tint(84)}, ${tint(30)})`,
      color: `light-dark(${ink(28)}, ${ink(80)})`
    },
    dot: { backgroundColor: accent }
  };
}
