import type { Listing } from '@/domain/types';
import { seedIndex } from './catalog';
import { platformStore } from './platform';
import { DATA_SOURCE, demoLatency, http } from './http';

// ---------------------------------------------------------------------------------------------
// Payments for Tanzania. Travellers pay with mobile money (M-Pesa, Airtel Money, Mixx by Yas,
// HaloPesa) or a Visa / Mastercard card from any bank. Direct bank payments (CRDB, NMB, NBC,
// Stanbic, TCB, …) follow once the bank integrations are live; until then, bank customers pay with
// their bank's Visa or Mastercard card.
//
// Production: a licensed Tanzanian payment aggregator processes every payment server-side
// (docs/payments/tanzania.md). This app never sees card numbers or mobile-money PINs, and no
// provider keys belong in the frontend.
// ---------------------------------------------------------------------------------------------

export type MobileNetwork = 'mpesa' | 'airtel' | 'mixx' | 'halopesa';
export interface MobileNetworkInfo { id: MobileNetwork; name: string; operator: string; ussd: string; prefixes: string[]; color: string }

/** Mobile-money services and their USSD menus. Prefixes only pre-select the network; the traveller can change it. */
export const MOBILE_NETWORKS: MobileNetworkInfo[] = [
  { id: 'mpesa', name: 'M-Pesa', operator: 'Vodacom', ussd: '*150*00#', prefixes: ['74', '75', '76'], color: '#e60000' },
  { id: 'airtel', name: 'Airtel Money', operator: 'Airtel', ussd: '*150*60#', prefixes: ['68', '69', '78'], color: '#ed1c24' },
  { id: 'mixx', name: 'Mixx by Yas', operator: 'Yas', ussd: '*150*01#', prefixes: ['65', '67', '71', '77'], color: '#1a3d8f' },
  { id: 'halopesa', name: 'HaloPesa', operator: 'Halotel', ussd: '*150*88#', prefixes: ['61', '62'], color: '#f47920' }
];
export const networkById = (id: MobileNetwork) => MOBILE_NETWORKS.find(n => n.id === id)!;

/** Banks whose customers can pay today with the bank's Visa or Mastercard card; direct bank payments are planned. */
export const TZ_BANKS = ['CRDB Bank', 'NMB Bank', 'NBC Bank', 'Stanbic Bank', 'TCB Bank', 'Exim Bank', 'Equity Bank', 'Absa Bank', 'KCB Bank', 'DTB', 'Azania Bank', 'Akiba Commercial Bank'];
export const CARD_SCHEMES = ['Visa', 'Mastercard'] as const;

/** Normalises a Tanzanian mobile number to +255XXXXXXXXX, or returns null. Accepts 07…, 06…, 2557…, +255 7…. */
export function normalizeTzMobile(input: string): string | null {
  const d = input.replace(/[^\d+]/g, '').replace(/^\+/, '');
  const local = d.startsWith('255') ? d.slice(3) : d.startsWith('0') ? d.slice(1) : d;
  return /^[67]\d{8}$/.test(local) ? `+255${local}` : null;
}
export function networkForNumber(e164: string | null): MobileNetwork | undefined {
  if (!e164) return undefined;
  const p = e164.slice(4, 6);
  return MOBILE_NETWORKS.find(n => n.prefixes.includes(p))?.id;
}
export const maskNumber = (e164: string) => `${e164.slice(0, 4)} ${e164.slice(4, 6)}• ••• ${e164.slice(-3)}`;

/** Indicative shilling amount for a USD price (rate set in System settings; the provider confirms the final amount). */
export const usdToTzs = (usd: number) => Math.round((usd * platformStore.get().payments.tzsPerUsd) / 50) * 50;

// ---------------- Where bookings and payments are open ----------------
/** Countries where travellers can book and pay. Everywhere else is preview-only until TravelMateVR launches there. */
export const bookingCountries = () => platformStore.get().payments.bookingCountries;
export const countryOfDestination = (destinationId: string) => seedIndex.destById.get(destinationId)?.countryId;
export const bookingOpenIn = (countryId: string | undefined) => !!countryId && bookingCountries().includes(countryId);
export const bookingOpen = (listing: Pick<Listing, 'destinationId'>) => bookingOpenIn(countryOfDestination(listing.destinationId));

// ---------------- Payment intents ----------------
export type PaymentChannel = { method: 'mobile_money'; network: MobileNetwork; phone: string } | { method: 'card' };
export interface PaymentIntent {
  id: string;
  amountUsd: number;
  amountTzs: number;
  channel: PaymentChannel;
  /** mobile money: the network sends a PIN prompt (USSD push) to the phone; card: the provider's hosted card page. */
  next: 'approve_on_phone' | 'redirect';
  redirectUrl?: string;
  status: 'pending' | 'succeeded' | 'failed';
}

export const payments = {
  /** Creates a payment with the aggregator (server-side). The demo only simulates the steps. */
  async start(input: { bookingRef: string; amountUsd: number; channel: PaymentChannel }): Promise<PaymentIntent> {
    if (DATA_SOURCE === 'http') return http<PaymentIntent>('/payments/intents', { method: 'POST', json: input });
    await demoLatency(600, 1000);
    return {
      id: `PI-${Date.now().toString(36).toUpperCase()}`, amountUsd: input.amountUsd, amountTzs: usdToTzs(input.amountUsd), channel: input.channel,
      next: input.channel.method === 'mobile_money' ? 'approve_on_phone' : 'redirect', status: 'pending'
    };
  },
  /** Production: the server learns the result from the aggregator's webhook; the app polls this endpoint. */
  async status(intent: PaymentIntent): Promise<PaymentIntent['status']> {
    if (DATA_SOURCE === 'http') return (await http<{ status: PaymentIntent['status'] }>(`/payments/intents/${intent.id}`)).status;
    await demoLatency(1200, 1800);
    return 'succeeded';
  }
};
