// Public company and contact details. Nothing secret belongs in this file.
export const SITE = {
  product: 'TravelMateVR',
  company: 'Mates Technologies Limited',
  copyrightYear: 2026,
  address: { line1: 'Mbeya CC', city: 'Mbeya', country: 'Tanzania' },
  email: 'info@travelmatevr.com',
  supportPhone: '+255767523749',
  supportPhoneDisplay: '+255 767 523 749',
  whatsapp: '255740014863',
  whatsappDisplay: '+255 740 014 863',
  url: import.meta.env.VITE_SITE_URL || 'https://travelmatevr.com'
} as const;

export type SocialId = 'whatsapp' | 'instagram' | 'x' | 'facebook';

export const SOCIAL: Record<SocialId, { url: string | null; handle: string | null }> = {
  whatsapp: { url: `https://wa.me/${SITE.whatsapp}`, handle: SITE.whatsappDisplay },
  instagram: { url: 'https://www.instagram.com/travelmate_vr', handle: '@travelmate_vr' },
  x: { url: 'https://x.com/mates_techn', handle: '@mates_techn' },
  // Placeholder until the Facebook page is provided.
  facebook: { url: null, handle: null }
};

/** Builds a WhatsApp click-to-chat link with a prefilled message (no API credentials involved). */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${SITE.whatsapp}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
