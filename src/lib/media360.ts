/**
 * Equirectangular (360°) content check. A true 360° panorama or video frame is exactly
 * 2:1 width:height — the same convention `scripts/optimize-media.mjs` already bakes in
 * when it resizes panorama variants (`height: w / 2`).
 *
 * Pure math only, no image-decoding dependency, so this is safe to import from anywhere —
 * a Node script measuring a file with `sharp(...).metadata()`, or a future browser upload
 * flow measuring a decoded `<img>`/`<video>` frame. Whoever accepts a file as `pano`/`video`
 * content (the seed migration today; any future admin/partner VR-content upload feature)
 * must call this before accepting it — non-360° media must never enter the real catalogue.
 */
export function isEquirectangular(width: number, height: number, tolerance = 0.02): boolean {
  if (!(width > 0) || !(height > 0)) return false;
  return Math.abs(width / height - 2) <= tolerance;
}
