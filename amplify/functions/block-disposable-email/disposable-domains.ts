// Domains of well-known free/disposable email providers (mailinator-style "inbox nobody owns")
// — not a general email-reputation service, just the handful of services whose entire purpose
// is a throwaway address, so blocking them has no real false-positive cost. Not exhaustive
// (new ones appear constantly); this closes the obvious case, not every case.
export const DISPOSABLE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'mailinator.com', 'mailinator.net', 'mailinator.org',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.biz', 'guerrillamailblock.com',
  'sharklasers.com', 'grr.la', 'pokemail.net', 'spam4.me',
  '10minutemail.com', '10minutemail.net', '10minemail.com', '20minutemail.com',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempmailo.com', 'tempmail.de',
  'throwawaymail.com', 'throwaway.email', 'getnada.com', 'nada.email',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf', 'jetable.fr.nf',
  'trashmail.com', 'trashmail.net', 'trashmail.de', 'trash-mail.com',
  'dispostable.com', 'maildrop.cc', 'mintemail.com', 'mytemp.email',
  'moakt.com', 'moakt.cc', 'tempinbox.com', 'tempr.email', 'emailondeck.com',
  'mohmal.com', 'mohmal.in', 'mailnesia.com', 'fakeinbox.com', 'fakemailgenerator.com',
  'mailcatch.com', 'mailtemp.net', 'mailpoof.com', 'mail-temporaire.fr',
  'discard.email', 'discardmail.com', 'spamgourmet.com', 'spambog.com',
  'anonbox.net', 'burnermail.io', 'inboxbear.com', 'instant-mail.de',
  'crazymailing.com', 'mytrashmail.com', 'tempmailaddress.com', 'emailfake.com',
  'luxusmail.org', 'armyspy.com', 'cuvox.de', 'dayrep.com', 'einrot.com',
  'fleckens.hu', 'gustr.com', 'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us'
]);
