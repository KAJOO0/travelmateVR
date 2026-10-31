import type { Experience, ExperienceKind, Review, Hotspot, Locale, LocalizedText, MediaId, PanoId, VideoId } from '@/domain/types';
import { createStore, nowIso, uid, useStore } from '@/lib/store';
import { EXPERIENCES } from '@/data/seed/experiences';
import { REVIEWS } from '@/data/seed/reviews';
import { seedIndex } from './catalog';
import { myReviewsStore } from './account';

// ---------------------------------------------------------------------------------------------
// Content moderation managed in the Command Center: review moderation and the VR content
// workflow. Like the partner and board overlays, decisions are applied to the catalogue so that
// traveller pages only show approved, published content.
// ---------------------------------------------------------------------------------------------

// ---------------- Reviews ----------------
/** Published reviews an admin has hidden (id → reason). */
export const reviewModerationStore = createStore<Record<string, string>>('tm.mod.reviews', () => ({}));
export const useReviewModeration = () => useStore(reviewModerationStore);

const ORIGINAL_REVIEWS = [...REVIEWS];
/** Every published (seeded) review, including ones an admin has hidden. */
export const allPublishedReviews = (): readonly Review[] => ORIGINAL_REVIEWS;
function applyReviewModeration() {
  const hidden = reviewModerationStore.get();
  REVIEWS.splice(0, REVIEWS.length, ...ORIGINAL_REVIEWS.filter(r => !hidden[r.id]));
}
applyReviewModeration();
reviewModerationStore.subscribe(applyReviewModeration);

export const reviewModeration = {
  approve(id: string) { myReviewsStore.set(list => list.map(r => (r.id === id ? { ...r, status: 'approved' } : r))); },
  reject(id: string) { myReviewsStore.set(list => list.map(r => (r.id === id ? { ...r, status: 'rejected' } : r))); },
  hide(id: string, reason: string) { reviewModerationStore.set(all => ({ ...all, [id]: reason })); },
  restore(id: string) { reviewModerationStore.set(all => { const n = { ...all }; delete n[id]; return n; }); }
};

// ---------------- VR content workflow ----------------
export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';
export const CONTENT_STATUSES: ContentStatus[] = ['draft', 'review', 'approved', 'published', 'archived'];

/** An experience created in the Command Center. Media comes from the processed media library. */
export interface AdminExperience {
  id: string;
  slug: string;
  title: Partial<LocalizedText>;
  tagline: Partial<LocalizedText>;
  narration?: Partial<LocalizedText>;
  lang: Locale;
  destinationId: string;
  kind: ExperienceKind;
  media: MediaId;
  /** 360° video (primary format); the panorama, if set, is its fallback. */
  video?: VideoId;
  pano?: PanoId;
  startYaw?: number;
  durationMin: number;
  hotspots: Hotspot[];
  listingIds: string[];
  /** Name of an uploaded source file waiting for processing (the file itself is not kept in the browser). */
  sourceFile?: string;
  createdAt: string;
  updatedAt: string;
}

export const experienceStatusStore = createStore<Record<string, ContentStatus>>('tm.mod.xpStatus', () => ({}));
export const adminExperienceStore = createStore<AdminExperience[]>('tm.mod.experiences', () => []);
export const useExperienceStatus = () => useStore(experienceStatusStore);
export const useAdminExperiences = () => useStore(adminExperienceStore);

const ORIGINAL_XPS = [...EXPERIENCES];
const fill = (t: Partial<LocalizedText> | undefined): LocalizedText => {
  const first = Object.values(t ?? {}).find(Boolean) ?? '';
  return { en: t?.en || first, fr: t?.fr, de: t?.de, zh: t?.zh, it: t?.it } as LocalizedText;
};
export function toExperience(a: AdminExperience): Experience {
  return {
    id: a.id, slug: a.slug, title: fill(a.title), tagline: fill(a.tagline), destinationId: a.destinationId, kind: a.kind, media: a.media,
    video: a.video, pano: a.pano, startYaw: a.startYaw, durationMin: a.durationMin, hasNarration: !!a.narration && Object.values(a.narration).some(Boolean),
    narration: a.narration ? fill(a.narration) : undefined, hotspots: a.hotspots, rating: 0, reviewCount: 0, listingIds: a.listingIds
  };
}
export const statusOf = (id: string, admin = false): ContentStatus => experienceStatusStore.get()[id] ?? (admin ? 'draft' : 'published');

function applyExperiences() {
  const status = experienceStatusStore.get();
  const created = adminExperienceStore.get();
  const visible = [
    ...ORIGINAL_XPS.filter(x => (status[x.id] ?? 'published') === 'published'),
    ...created.filter(a => status[a.id] === 'published').map(toExperience)
  ];
  EXPERIENCES.splice(0, EXPERIENCES.length, ...visible);
  seedIndex.experienceById.clear();
  for (const x of visible) seedIndex.experienceById.set(x.id, x);
}
applyExperiences();
experienceStatusStore.subscribe(applyExperiences);
adminExperienceStore.subscribe(applyExperiences);

/** Every experience the Command Center manages (published or not), with its status. */
export function allManagedExperiences(): { xp: Experience; status: ContentStatus; created: boolean }[] {
  const status = experienceStatusStore.get();
  return [
    ...adminExperienceStore.get().map(a => ({ xp: toExperience(a), status: status[a.id] ?? 'draft' as ContentStatus, created: true })),
    ...ORIGINAL_XPS.map(x => ({ xp: x, status: status[x.id] ?? 'published' as ContentStatus, created: false }))
  ];
}

export const vrAdmin = {
  setStatus(id: string, s: ContentStatus) { experienceStatusStore.set(all => ({ ...all, [id]: s })); },
  save(a: Omit<AdminExperience, 'id' | 'slug' | 'createdAt' | 'updatedAt'> & { id?: string }): string {
    const id = a.id ?? uid('xp_');
    const base = (a.title.en || Object.values(a.title).find(Boolean) || 'experience').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 48) || 'experience';
    adminExperienceStore.set(list => list.some(x => x.id === id)
      ? list.map(x => (x.id === id ? { ...x, ...a, id, updatedAt: nowIso() } : x))
      : [{ ...a, id, slug: `${base}-${id.slice(-4)}`, createdAt: nowIso(), updatedAt: nowIso() }, ...list]);
    if (!experienceStatusStore.get()[id]) vrAdmin.setStatus(id, 'draft');
    return id;
  },
  remove(id: string) {
    adminExperienceStore.set(list => list.filter(x => x.id !== id));
    experienceStatusStore.set(all => { const n = { ...all }; delete n[id]; return n; });
  }
};
