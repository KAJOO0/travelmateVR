import videos from '@/data/videos.generated.json';
import type { Experience } from '@/domain/types';

// Immersive formats, in order of priority: 360° video first, then 360° photo, then the
// panoramic preview of a regular photo (used until a 360° capture exists).

export interface VideoInfo {
  name: string; author: string; license: string; licenseUrl: string; source: string;
  src: string; poster: string; width: number; height: number; duration: number; audio: boolean; bytes: number;
  /** Changes made to the original (CC BY attribution requires indicating them). */
  modified?: string;
}
export const VIDEOS = videos as Record<string, VideoInfo>;

export type ImmersiveFormat = 'video' | 'photo360' | 'preview';
export const FORMATS: ImmersiveFormat[] = ['video', 'photo360', 'preview'];
const RANK: Record<ImmersiveFormat, number> = { video: 0, photo360: 1, preview: 2 };

export const videoOf = (x: Pick<Experience, 'video'>): VideoInfo | undefined => (x.video ? VIDEOS[x.video] : undefined);
export const formatOf = (x: Pick<Experience, 'video' | 'pano'>): ImmersiveFormat => (videoOf(x) ? 'video' : x.pano ? 'photo360' : 'preview');
/** True for real 360° content (video or photo), false for panoramic previews. */
export const is360 = (x: Pick<Experience, 'video' | 'pano'>) => formatOf(x) !== 'preview';
/** Sort comparator: 360° video, then 360° photo, then previews. */
export const byFormat = (a: Pick<Experience, 'video' | 'pano'>, b: Pick<Experience, 'video' | 'pano'>) => RANK[formatOf(a)] - RANK[formatOf(b)];
