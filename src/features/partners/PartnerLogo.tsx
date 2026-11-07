import type { Partner } from '@/domain/types';
import { S3Image } from '@/components/ui/S3Image';

// A real upload (src/services/business.ts's partnerProfile.uploadLogo) vs. a seed-data
// manifest id resolved through src/lib/media.ts's static build-time manifest — that path
// can't resolve a freshly uploaded file at all (confirmed: it only knows ids baked in at
// build time), so a real logo needs the S3 key -> presigned URL path (S3Image) instead.
const isS3Key = (v: string | undefined): v is string => !!v?.startsWith('profile-media/');

export function PartnerLogo({ partner, large }: { partner: Partner; large?: boolean }) {
  const initials = partner.name.split(/\s+/).filter(w => /^\p{L}/u.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const size = large ? 72 : 48;
  if (!partner.logo) return <span className="partner-logo initials" aria-hidden="true">{initials}</span>;
  if (isS3Key(partner.logo)) {
    return (
      <span className="partner-logo">
        <S3Image s3Key={partner.logo} alt={`${partner.name} logo`} fallback={<span className="partner-logo initials" aria-hidden="true">{initials}</span>} />
      </span>
    );
  }
  return (
    <span className="partner-logo">
      <img src={`/media/${partner.logo}-${large ? 320 : 160}.webp`} alt={`${partner.name} logo`} width={size} height={size} loading="lazy" />
    </span>
  );
}
