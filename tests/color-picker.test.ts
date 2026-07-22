import { describe, expect, it } from 'bun:test';
import { hsvToRgb, hueFromPoint, rgbToHsv, saturationValueFromPoint } from '../src/core/color/color-picker';

describe('color picker math', () => {
  it('round-trips normalized RGB colors through HSV', () => {
    const source = { r: 115 / 255, g: 140 / 255, b: 69 / 255 };
    const result = hsvToRgb(rgbToHsv(source));
    expect(result.r).toBeCloseTo(source.r, 6);
    expect(result.g).toBeCloseTo(source.g, 6);
    expect(result.b).toBeCloseTo(source.b, 6);
  });

  it('maps the top, right and bottom of the hue ring clockwise', () => {
    expect(hueFromPoint(50, 0, 50, 50)).toBeCloseTo(0);
    expect(hueFromPoint(100, 50, 50, 50)).toBeCloseTo(90);
    expect(hueFromPoint(50, 100, 50, 50)).toBeCloseTo(180);
  });

  it('maps the saturation/value square and clamps outside positions', () => {
    expect(saturationValueFromPoint(100, 0, 100, 100)).toEqual({ s: 1, v: 1 });
    expect(saturationValueFromPoint(-10, 120, 100, 100)).toEqual({ s: 0, v: 0 });
  });
});
