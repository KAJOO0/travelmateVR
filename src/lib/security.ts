// Input hygiene and password hashing used by the sign-in and registration flows.
//
// IMPORTANT: browser-side checks improve the experience and keep junk out of the demo store, but
// they can be bypassed. The production API must apply the same rules on the server (see
// docs/security/authentication.md): validate and normalise every field, hash passwords with
// Argon2id, rate-limit sign-in attempts and return generic errors.

/** Invisible and control characters that are never valid in names, emails or usernames. */
const CONTROL_CHARS = '[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\u2060\uFEFF]';
const CONTROL = new RegExp(CONTROL_CHARS, 'g');
const HAS_CONTROL = new RegExp(CONTROL_CHARS);

/** Free text such as a display name: normalised, without markup characters or control characters. */
export function cleanText(value: string, max = 120): string {
  return value.normalize('NFKC').replace(CONTROL, '').replace(/<[^>]*>/g, ' ').replace(/[<>`]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export const EMAIL_MAX = 254;
const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/;
export function normalizeEmail(value: string): string {
  return value.normalize('NFKC').replace(CONTROL, '').trim().toLowerCase();
}
export const isEmail = (value: string) => { const v = normalizeEmail(value); return v.length <= EMAIL_MAX && EMAIL_RE.test(v); };

/** Usernames: 3–30 characters, lowercase letters, digits, dot, underscore or hyphen; must start and end with a letter or digit. */
const USERNAME_RE = /^[a-z0-9](?:[a-z0-9._-]{1,28})[a-z0-9]$/;
export function normalizeUsername(value: string): string {
  return value.normalize('NFKC').replace(CONTROL, '').trim().toLowerCase();
}
export const isUsername = (value: string) => USERNAME_RE.test(normalizeUsername(value));

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;
const HAS_LOWER = /[a-z]/;
const HAS_UPPER = /[A-Z]/;
const HAS_NUMBER = /[0-9]/;
// Cognito's own RequireSymbols character set (docs.aws.amazon.com/cognito, "password policy") -
// kept to exactly this set, not a broader "any non-alphanumeric", so a password this check
// accepts is never rejected by the pool's matching composition rule (2026-11-08 audit #10).
const HAS_SYMBOL = /[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`+=-]/;
/** Passwords are not altered (no trimming), only checked for length, control characters and composition. */
export const isAcceptablePassword = (value: string) =>
  value.length >= PASSWORD_MIN && value.length <= PASSWORD_MAX && !HAS_CONTROL.test(value) &&
  HAS_LOWER.test(value) && HAS_UPPER.test(value) && HAS_NUMBER.test(value) && HAS_SYMBOL.test(value);

// ---------------- Password hashing (demo store) ----------------
// The demo keeps simulated accounts on the device, so it hashes passwords with PBKDF2-SHA-256
// (Web Crypto) and a random salt; the plain password is never stored. Production hashes on the
// server with Argon2id and never sends hashes to the browser.
const ITERATIONS = 310_000;
const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations }, key, 256);
  return new Uint8Array(bits);
}

/** Returns "pbkdf2-sha256$<iterations>$<salt>$<hash>". */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${ITERATIONS}$${b64(salt)}$${b64(await derive(password, salt, ITERATIONS))}`;
}

/** Constant-time comparison of a password against a stored hash. */
export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  // With no stored hash (unknown account) a dummy hash is still computed, so response time does not reveal whether the account exists.
  const [scheme, iter, salt, hash] = (stored ?? `pbkdf2-sha256$${ITERATIONS}$${b64(new Uint8Array(16))}$`).split('$');
  if (scheme !== 'pbkdf2-sha256' || !iter || !salt) return false;
  const actual = await derive(password, unb64(salt), Number(iter));
  const expected = hash ? unb64(hash) : new Uint8Array(actual.length);
  let diff = actual.length ^ expected.length;
  for (let i = 0; i < actual.length; i++) diff |= actual[i]! ^ (expected[i] ?? 0);
  return !!stored && diff === 0;
}
