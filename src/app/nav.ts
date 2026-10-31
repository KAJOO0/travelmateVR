import type { IconName } from '@/components/ui/Icon';

export interface NavItem { key: string; to: string; icon: IconName }

/** Shown in the header pill (desktop). "Partners" (a menu) and "About" follow these. */
export const PRIMARY_NAV: NavItem[] = [
  { key: 'home', to: '/', icon: 'home' },
  { key: 'explore', to: '/explore', icon: 'compass' },
  { key: 'destinations', to: '/destinations', icon: 'pin' },
  { key: 'experiences', to: '/vr', icon: 'view360' },
  { key: 'aiPlanner', to: '/ai', icon: 'sparkles' }
];

/** "Partners" menu: one entry per kind of tourism business or body. */
export const PARTNER_NAV: NavItem[] = [
  { key: 'operators', to: '/partners#for-operators', icon: 'binoculars' },
  { key: 'hotels', to: '/partners#for-hotels', icon: 'bed' },
  { key: 'guides', to: '/partners#for-guides', icon: 'compass' },
  { key: 'boards', to: '/tourism-boards', icon: 'landmark' },
  { key: 'creators', to: '/creators', icon: 'video360' },
  { key: 'pricing', to: '/partners#pl-plans', icon: 'ticket' },
  { key: 'login', to: '/business', icon: 'user' }
];

/** Marketplace categories under "More". */
export const MORE_NAV: NavItem[] = [
  { key: 'stays', to: '/stays', icon: 'bed' },
  { key: 'safaris', to: '/safaris', icon: 'binoculars' },
  { key: 'activities', to: '/activities', icon: 'activity' },
  { key: 'transport', to: '/transport', icon: 'car' },
  { key: 'restaurants', to: '/restaurants', icon: 'utensils' },
  { key: 'events', to: '/events', icon: 'ticketStar' }
];

/** Mobile bottom navigation. */
export const MOBILE_NAV: NavItem[] = [
  { key: 'home', to: '/', icon: 'home' },
  { key: 'explore', to: '/explore', icon: 'compass' },
  { key: 'trips', to: '/trips', icon: 'suitcase' },
  { key: 'bookings', to: '/bookings', icon: 'ticket' },
  { key: 'profile', to: '/account', icon: 'user' }
];

import type { ListingType } from '@/domain/types';

/** Marketplace page for each listing type. */
export const TYPE_PATH: Record<ListingType, string> = { stay: '/stays', safari: '/safaris', activity: '/activities', restaurant: '/restaurants', transport: '/transport', event: '/events', local: '/experiences' };
