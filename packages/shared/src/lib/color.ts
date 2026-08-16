/**
 * Colour maths shared by Web + Mobile.
 *
 * The web design leans on CSS `color-mix(in oklab, <color> <pct>%, white)` to tint
 * subject tiles (GradeCard, HomeworkItemRow, SubjectIcon, PeriodCell). React Native
 * has no `color-mix`, so mobile has to compute the same value in JS. Both platforms
 * must use THIS function rather than each approximating the blend, or the tints drift.
 *
 * The mix is performed in OKLab to match the CSS `in oklab` interpolation space
 * exactly — a naive sRGB lerp produces visibly different (muddier) tints.
 */

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n)

/** sRGB channel (0–1, gamma-encoded) → linear-light. */
const toLinear = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)

/** Linear-light channel → sRGB (0–1, gamma-encoded). */
const toGamma = (c: number): number =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055

type Rgb = readonly [number, number, number]
type Lab = readonly [number, number, number]

/** Parse `#rgb` / `#rrggbb` (with or without `#`) into 0–1 sRGB channels. */
function parseHex(hex: string): Rgb | null {
  const raw = hex.trim().replace(/^#/, '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : raw
  if (full.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(full)) return null
  const n = parseInt(full, 16)
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255]
}

function toHex([r, g, b]: Rgb): string {
  const channel = (c: number): string =>
    Math.round(clamp01(c) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

/** sRGB (0–1) → OKLab. Coefficients from Björn Ottosson's OKLab reference. */
function srgbToOklab([r, g, b]: Rgb): Lab {
  const lr = toLinear(r)
  const lg = toLinear(g)
  const lb = toLinear(b)

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** OKLab → sRGB (0–1), clamped into gamut. */
function oklabToSrgb([L, A, B]: Lab): Rgb {
  const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3)
  const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3)
  const s = Math.pow(L - 0.0894841775 * A - 1.291485548 * B, 3)

  return [
    clamp01(toGamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    clamp01(toGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    clamp01(toGamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  ]
}

/**
 * Blend `hex` with white in OKLab — the JS equivalent of
 * `color-mix(in oklab, <hex> <pct>%, white)`.
 *
 * @param hex Source colour, `#rgb` or `#rrggbb`.
 * @param pct Percentage of the SOURCE colour to keep (0–100). The remainder is
 *            white, so a lower value means a paler tint. Web passes 8 and 15.
 * @returns   `#rrggbb`. Falls back to plain white if `hex` cannot be parsed.
 */
export function mixWithWhite(hex: string, pct: number): string {
  const rgb = parseHex(hex)
  if (!rgb) return '#ffffff'

  const weight = clamp01(pct / 100)
  const [L, A, B] = srgbToOklab(rgb)
  // White in OKLab is (1, 0, 0), so the blend collapses to a lerp toward that point.
  return toHex(oklabToSrgb([L * weight + (1 - weight), A * weight, B * weight]))
}
