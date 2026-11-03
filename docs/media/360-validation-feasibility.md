# 360° content validation — feasibility report

Required by the platform optimization directive, section 6. This is an honest assessment,
not a claim of completed work — **there is currently no file upload feature in the product at
all** (confirmed by inspecting `services/business.ts`'s `vrContent.submit` and
`services/moderation.ts`'s VR workflow: both are demo/mock-only, with no Amplify Storage
resource, no real file transport, and no backend validation step anywhere in the codebase).
So this report answers "if/when an upload feature is built, what's achievable" — it is not a
retrofit of something that exists today.

## What already exists

`src/lib/media360.ts` — `isEquirectangular(width, height, tolerance)`. A pure 2:1 aspect-ratio
check, used today only by `scripts/migrate-seed-to-amplify.ts` to validate the project's own
curated panorama/video assets before they enter the real catalogue (see `amplify/data/resource.ts`
decision 12). This is explicitly **not** sufficient proof of genuine 360° content on its own —
the directive is right to call this out, and the code comment already says so. Any image or
video cropped/resized to exactly 2:1 passes this check without being a real panorama.

## A. Image validation — what's actually checkable

| Signal | Reliable? | Notes |
|---|---|---|
| 2:1 aspect ratio | Weak heuristic only | Already implemented. Necessary but not sufficient — easily spoofed by cropping any photo to 2:1. |
| Google `GPano` XMP metadata (`ProjectionType`, `UsePanoramaViewer`, `FullPanoWidthPixels`, etc.) | **Strong, when present** | The de facto standard embedded by panorama cameras/apps (Google Street View app, Insta360, Ricoh Theta, most stitching software). Parseable server-side with the `exifr` npm package (pure JS, no native binary, actively maintained). |
| Pixel-level equirectangular distortion analysis (pole-stretch detection, left/right edge seam continuity) | Not reliable to build in this scope | This is a real computer-vision research problem, not a library call. No off-the-shelf JS/Node library does this reliably. Out of scope for a reasonable implementation. |

**Conclusion:** automatic image validation is *partially* possible. Metadata presence is a
trustworthy positive signal; metadata absence proves nothing (many genuine panoramas lose
metadata when re-saved through non-panorama-aware editors) — these must fall to manual review,
not auto-rejection.

## B. Video validation — what's actually checkable

| Signal | Reliable? | Notes |
|---|---|---|
| 2:1 aspect ratio | Weak heuristic only | Same caveat as images. |
| Google Spherical Video V2 metadata box (embedded `uuid` atom in MP4/MOV) | **Strong, when present** | The standard YouTube 360 and most spherical cameras embed. Readable via `ffprobe` (already a project dependency in spirit — `scripts/build-videos.mjs` already requires `ffmpeg`/`ffprobe` on `PATH` locally for the 360° video transcode pipeline), or via `mp4box.js` for a pure-JS alternative. |
| Pixel-level distortion analysis | Not reliable to build in this scope | Same as images. |

**Conclusion:** same shape as images — metadata presence is trustworthy, absence is
inconclusive, not disqualifying.

## C. Upload restrictions — what would be needed

Client-side checks (aspect ratio, even metadata parsing in-browser) **can always be bypassed by
a direct API call**, exactly as the directive's own section 6C warns. Real enforcement requires
server-side validation, which requires server-side compute that doesn't exist yet:

1. An Amplify **Storage** resource (S3 bucket) — not currently defined anywhere in `amplify/`.
2. A Lambda function triggered on upload (S3 event or Storage trigger) that runs the metadata
   checks above using `exifr` (images) and a bundled `ffprobe` binary via a Lambda layer
   (videos — Lambda's runtime doesn't include ffmpeg by default; this is a well-trodden pattern
   with public layers available, but it is a real new piece of infrastructure, not free).
3. Rejection with a clear, specific error message (not just "invalid file") so the uploader
   knows what to fix.

## D. Exceptions and manual review

Ambiguous cases (2:1-ish ratio, no panorama metadata) should queue for **admin approval**, not
auto-accept or auto-reject. This ties directly into the VR content admin workflow already
*designed* for in `services/moderation.ts` (`ContentStatus`, draft → review → approved →
published) — but that workflow is still demo/mock-only (an out-of-scope phase from the earlier
AWS backend rollout), so a real review queue needs that backend work done first, not just the
validation logic.

## E. Direct answers to the mandatory questions

1. **Automatic 360° image validation possible?** Partially. Reliable when embedded `GPano`
   metadata is present; not reliably detectable when absent.
2. **Automatic 360° video validation possible?** Partially, same shape, via spherical video
   metadata boxes.
3. **Formats/metadata reliably checkable?** JPEG/PNG `GPano` XMP tags; MP4/MOV spherical video
   metadata atoms; aspect ratio as a weak first-pass filter for both.
4. **Additional libraries required:** `exifr` (image XMP parsing, pure JS); a bundled `ffprobe`
   binary via a Lambda layer (video metadata parsing — no good pure-JS equivalent for this
   specific metadata box exists).
5. **Additional backend processing necessary?** Yes — this cannot be done client-side only;
   needs a Storage resource + a Lambda trigger, neither of which exist today.
6. **Cases requiring manual review:** any upload with a plausible aspect ratio but no panorama
   metadata. This is expected to be common, not an edge case — don't auto-reject these.
7. **Implementation complexity and cost:** Moderate. New AWS resources: one S3 bucket (Amplify
   Storage) and one Lambda function (likely within free-tier at current traffic levels, but it
   is new recurring infrastructure, which the directive asks to avoid unless genuinely
   necessary — this is, since there's no other way to enforce this server-side). The admin
   review queue is a larger, separate piece of work tied to building out the admin backend
   that's currently still mock-only.

**Bottom line:** the strongest honest claim achievable is "flags genuine positives reliably via
metadata, cannot prove a negative, and must route ambiguous cases to a human" — not "detects
fake 360° content with certainty." Any implementation that claims otherwise would be overstating
what's actually achievable here.
