import { describe, expect, it } from 'vitest';
import type { Listing } from '@/domain/types';
import { chargeableGuests } from './pricing';

const listing = (type: Listing['type']) => ({ type }) as Listing;

describe('chargeableGuests', () => {
  it('counts every adult and child in full for a stay', () => {
    expect(chargeableGuests(2, 2, listing('stay'))).toBe(4);
  });

  it('charges children at half rate on a safari', () => {
    expect(chargeableGuests(2, 2, listing('safari'))).toBe(3);
  });

  it('charges children at half rate on an activity', () => {
    expect(chargeableGuests(1, 1, listing('activity'))).toBe(1.5);
  });

  it('charges children at full rate on a restaurant booking', () => {
    expect(chargeableGuests(2, 1, listing('restaurant'))).toBe(3);
  });
});
