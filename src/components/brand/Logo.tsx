import { LOGO_BLUE, LOGO_INK, LOGO_VIEWBOX, LOGO_WHITE } from './logoPaths';

/**
 * TravelMateVR logo. The ink layer (wordmark, lens, VR mark) follows --logo-ink,
 * so it is white on the dark theme and near-black on the light theme.
 */
export function Logo({ className = 'logo', title = 'TravelMateVR' }: { className?: string; title?: string | null }) {
  return (
    <svg className={className} viewBox={LOGO_VIEWBOX} role={title ? 'img' : undefined} aria-label={title ?? undefined} aria-hidden={title ? undefined : true}>
      <path fillRule="evenodd" fill="#0070BA" d={LOGO_BLUE} />
      <path fillRule="evenodd" fill="#fff" d={LOGO_WHITE} />
      <path fillRule="evenodd" fill="var(--logo-ink)" d={LOGO_INK} />
    </svg>
  );
}
