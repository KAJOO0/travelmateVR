import type { Partner } from '@/domain/types';

export function PartnerLogo({ partner, large }: { partner: Partner; large?: boolean }) {
  if (partner.logo) {
    return (
      <span className="partner-logo">
        <img src={`/media/${partner.logo}-${large ? 320 : 160}.webp`} alt={`${partner.name} logo`} width={large ? 72 : 48} height={large ? 72 : 48} loading="lazy" />
      </span>
    );
  }
  const initials = partner.name.split(/\s+/).filter(w => /^\p{L}/u.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return <span className="partner-logo initials" aria-hidden="true">{initials}</span>;
}
