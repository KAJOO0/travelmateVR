// Provider-agnostic outbound messaging. The frontend only asks the backend to send; providers
// (email, SMS, WhatsApp Business, web push) and their credentials live server-side.
import { DATA_SOURCE, http } from './http';

export type Channel = 'email' | 'sms' | 'whatsapp' | 'push' | 'inapp';
export type MessageTemplate = 'booking_confirmation' | 'payment_received' | 'trip_reminder' | 'support_update' | 'partner_reply';

export interface OutboundMessage { template: MessageTemplate; channels: Channel[]; data: Record<string, string | number> }

export interface MessagingService {
  send(msg: OutboundMessage): Promise<{ queued: Channel[] }>;
}

const demoMessaging: MessagingService = {
  // Demo mode: nothing leaves the device. In-app notifications are created by the calling service.
  async send(msg) { return { queued: msg.channels.filter(c => c === 'inapp') }; }
};

const httpMessaging: MessagingService = {
  send: (msg) => http('/messaging/outbound', { method: 'POST', json: msg })
};

export const messaging: MessagingService = DATA_SOURCE === 'http' ? httpMessaging : demoMessaging;
