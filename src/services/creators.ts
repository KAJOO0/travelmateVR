import { createStore, nowIso, useStore } from '@/lib/store';
import { formatOf } from '@/lib/immersive';
import { seedIndex } from './catalog';
import { demoLatency } from './http';
import type { Destination, Experience } from '@/domain/types';

// ---------------------------------------------------------------------------------------------
// Creator programme: travel vloggers, 360° filmmakers, photographers and local operators who
// capture destinations in 360°. Applications are reviewed by the content team in the Command
// Center (VR content). Demo: stored on the device; production: the creators API, with the agreement
// and payout details handled outside the browser.
// ---------------------------------------------------------------------------------------------

export type CreatorType = 'vlogger' | 'filmmaker' | 'photographer' | 'drone' | 'operator';
export const CREATOR_TYPES: CreatorType[] = ['vlogger', 'filmmaker', 'photographer', 'drone', 'operator'];
export type CaptureFormat = 'video' | 'photo360';
export const AUDIENCE_SIZES = ['none', 'lt10k', '10k100k', '100k1m', 'gt1m'] as const;
export type AudienceSize = (typeof AUDIENCE_SIZES)[number];

export interface CreatorApplication {
  id: string;
  name: string;
  email: string;
  type: CreatorType;
  /** Where the creator is based (free text: city, country). */
  base: string;
  /** Catalogue destinations they can capture. */
  destinations: string[];
  /** Other places they could capture that are not in the catalogue yet. */
  otherPlaces: string;
  formats: CaptureFormat[];
  /** Channel or portfolio links (https). */
  links: string[];
  audience: AudienceSize;
  gear: string;
  languages: string[];
  about: string;
  /** The creator confirmed they own the rights and will get consent from people filmed. */
  rightsConfirmed: boolean;
  status: 'submitted' | 'in_review' | 'approved' | 'rejected';
  createdAt: string;
  decidedAt?: string;
  decisionNote?: string;
}

export const creatorApplicationStore = createStore<CreatorApplication[]>('tm.creators.applications', () => []);
export const useCreatorApplications = () => useStore(creatorApplicationStore);

export const creatorApplications = {
  async submit(a: Omit<CreatorApplication, 'id' | 'createdAt' | 'status'>): Promise<CreatorApplication> {
    await demoLatency(700, 1200);
    const app: CreatorApplication = { ...a, id: `CRE-${Date.now().toString(36).toUpperCase().slice(-6)}`, status: 'submitted', createdAt: nowIso() };
    creatorApplicationStore.set(list => [app, ...list]);
    return app;
  },
  decide(id: string, status: CreatorApplication['status'], note?: string) {
    creatorApplicationStore.set(list => list.map(a => (a.id === id ? { ...a, status, decidedAt: nowIso(), decisionNote: note } : a)));
  }
};

/** Places the content team most wants captured: experiences that only have a photo preview, and destinations with no 360° content at all. */
export function wantedCaptures(): { experiences: Experience[]; destinations: Destination[] } {
  const experiences = seedIndex.experiences.filter(e => formatOf(e) === 'preview');
  const destinations = seedIndex.destinations.filter(d => !seedIndex.experiences.some(e => e.destinationId === d.id && formatOf(e) !== 'preview'));
  return { experiences, destinations };
}
