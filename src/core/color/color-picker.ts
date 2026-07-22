export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HsvColor {
  h: number;
  s: number;
  v: number;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

export function rgbToHsv({ r, g, b }: RgbColor): HsvColor {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta > 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

export function hsvToRgb({ h, s, v }: HsvColor): RgbColor {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp01(s);
  const value = clamp01(v);
  const chroma = value * saturation;
  const segment = hue / 60;
  const x = chroma * (1 - Math.abs((segment % 2) - 1));
  const [r1, g1, b1] =
    segment < 1
      ? [chroma, x, 0]
      : segment < 2
        ? [x, chroma, 0]
        : segment < 3
          ? [0, chroma, x]
          : segment < 4
            ? [0, x, chroma]
            : segment < 5
              ? [x, 0, chroma]
              : [chroma, 0, x];
  const match = value - chroma;
  return { r: r1 + match, g: g1 + match, b: b1 + match };
}

export function hueFromPoint(x: number, y: number, centerX: number, centerY: number): number {
  return ((Math.atan2(x - centerX, centerY - y) * 180) / Math.PI + 360) % 360;
}

export function saturationValueFromPoint(
  x: number,
  y: number,
  width: number,
  height: number,
): Pick<HsvColor, 's' | 'v'> {
  return {
    s: clamp01(x / Math.max(width, 1)),
    v: 1 - clamp01(y / Math.max(height, 1)),
  };
}
