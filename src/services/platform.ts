import { createStore, useStore } from '@/lib/store';

// ---------------------------------------------------------------------------------------------
// Platform settings, managed in the admin Command Center (System settings).
// Demo: stored on the device. Production: served by the configuration API and changed only by
// super administrators, with every change written to the audit log.
// ---------------------------------------------------------------------------------------------

export interface PlatformSettings {
  /** Fee charged to travellers on base price and extras (0.04 = 4%). */
  serviceFeeRate: number;
  /** Share paid now when a traveller chooses to pay a deposit. */
  depositRate: number;
  /** Highest discount a partner offer may give, in percent. */
  maxPartnerDiscount: number;
  maintenance: { on: boolean; message: string };
  flags: {
    /** AI TravelMate planner and Q&A. */
    aiPlanner: boolean;
    /** WebXR headset mode in the 360° viewer. */
    headsetMode: boolean;
    /** Public partner applications at /partners/join. */
    partnerApplications: boolean;
    /** Travellers can submit new reviews. */
    reviews: boolean;
    /** Public creator applications at /creators/apply. */
    creatorApplications: boolean;
  };
  /**
   * Creator programme terms shown on /creators (draft until confirmed in the creator agreement).
   * Creators earn from subscriptions and from views of their published experiences.
   */
  creators: {
    /** Share of subscription revenue paid into the creator pool, split by watch time (0.2 = 20%). */
    subscriptionShareRate: number;
    /** USD paid per 1,000 qualified views of a creator's experiences. */
    perThousandViewsUsd: number;
    /** Seconds of watching that count as one qualified view. */
    qualifiedViewSeconds: number;
  };
  /** Where travellers can book and pay, and the indicative exchange rate shown for shillings. */
  payments: {
    /** Country ids open for bookings and payments; everywhere else is preview-only. */
    bookingCountries: string[];
    /** Indicative TZS per USD shown at checkout (the provider confirms the final amount). */
    tzsPerUsd: number;
  };
  /** maxLoginAttempts failed sign-ins in a row block sign-in for lockoutMinutes. */
  security: { require2faForAdmins: boolean; sessionTimeoutMin: number; maxLoginAttempts: number; lockoutMinutes: number };
}

export const DEFAULT_PLATFORM: PlatformSettings = {
  serviceFeeRate: 0.04, depositRate: 0.3, maxPartnerDiscount: 50,
  maintenance: { on: false, message: '' },
  flags: { aiPlanner: true, headsetMode: true, partnerApplications: true, reviews: true, creatorApplications: true },
  creators: { subscriptionShareRate: 0.2, perThousandViewsUsd: 1.5, qualifiedViewSeconds: 30 },
  payments: { bookingCountries: ['tanzania', 'zanzibar'], tzsPerUsd: 2600 },
  security: { require2faForAdmins: true, sessionTimeoutMin: 30, maxLoginAttempts: 5, lockoutMinutes: 120 }
};

export const platformStore = createStore<PlatformSettings>('tm.platform', () => structuredClone(DEFAULT_PLATFORM));
// Settings saved by an earlier version may miss newer keys: fill them from the defaults.
{
  const s = platformStore.get();
  const missing = (k: 'flags' | 'security' | 'creators' | 'payments') => !s[k] || Object.keys(DEFAULT_PLATFORM[k]).some(x => !(x in (s[k] as object)));
  if (missing('flags') || missing('security') || missing('creators') || missing('payments')) {
    platformStore.set({
      ...structuredClone(DEFAULT_PLATFORM), ...s,
      flags: { ...DEFAULT_PLATFORM.flags, ...s.flags }, security: { ...DEFAULT_PLATFORM.security, ...s.security },
      creators: { ...DEFAULT_PLATFORM.creators, ...s.creators }, payments: { ...DEFAULT_PLATFORM.payments, ...s.payments }
    });
  }
}
export const usePlatform = () => useStore(platformStore);

export const serviceFeeRate = () => platformStore.get().serviceFeeRate;
export const depositRate = () => platformStore.get().depositRate;
export const feature = (k: keyof PlatformSettings['flags']) => platformStore.get().flags[k];
