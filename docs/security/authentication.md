# Authentication security requirements

Status: **required before the live sign-in service launches.**

The web app already applies these rules in the browser (`src/lib/security.ts`, `auth` and `loginGuard` in `src/services/account.ts`). Browser checks can be bypassed, so **the API must enforce every rule below on the server**. When `VITE_DATA_SOURCE=http`, the app calls the endpoints described here and expects these responses.

## 1. Validate and clean every user field on the server

Treat every request field as untrusted, including fields the browser has already checked.

| Field | Server rule |
|---|---|
| Email | Unicode NFKC normalise, trim, lowercase. Reject control or invisible characters (U+0000–U+001F, U+007F–U+009F, U+200B–U+200F, U+2028, U+2029, U+2060, U+FEFF). At most 254 characters, valid address syntax. Store the normalised form and give it a unique index. |
| Username (optional) | NFKC normalise, trim, lowercase. Allowlist `^[a-z0-9](?:[a-z0-9._-]{1,28})[a-z0-9]$` (3–30 characters). Unique index. Reserve names such as `admin`, `support`, `travelmatevr`. |
| Display name | NFKC normalise, remove control characters and `<`, `>` and backticks, collapse whitespace, 2–80 characters. |
| Password | Do **not** trim or alter it. 8–128 characters with no control characters. Check new passwords against a breached-password list (e.g. the k-anonymity Pwned Passwords API). |

Script attacks also need defence at every other layer:

- **Database:** use parameterised queries or an ORM only; never build SQL from strings.
- **Output:** encode on output. React escapes text by default, so never use `dangerouslySetInnerHTML` with user data. Encode values in emails, PDFs and CSV exports (CSV export already neutralises formulas).
- **Request size:** reject unknown JSON fields and limit the request body (e.g. 16 KB for auth endpoints).
- **Response headers:**
  - `Content-Security-Policy`: at least `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`, plus the map tile, font and API origins actually used.
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security`

## 2. Limit sign-in attempts: 5 failures, then a 2-hour lock

- Count failed sign-ins per **account** (normalised email or username) **and** per **client IP**.
- After **5** failures in a row (`maxLoginAttempts`), block further attempts for **120 minutes** (`lockoutMinutes`). Both values are set in Command Center → System settings and must come from server configuration.
- While locked, reject attempts **without checking the password** and respond `429 Too Many Requests` with:
  - the header `Retry-After: <seconds>`
  - the body `{ "error": "locked", "lockedUntil": "<ISO 8601>" }`

  The app shows "sign-in is paused until <time>".
- A successful sign-in resets the account counter. A lock expires on its own; support staff can clear it after verifying the user.
- Store counters in Redis or similar, with expiry. Log every lock to the security events feed in the Command Center.
- Do not lock out the real owner indefinitely: offer password reset by email while locked.

## 3. Never store passwords, only a salted hash

- Hash with **Argon2id** (memory ≥ 19 MiB, iterations ≥ 2, parallelism 1, per OWASP), using a unique random salt for each password. If Argon2id is unavailable, use bcrypt with cost ≥ 12.
- Store only the encoded hash string. Never log passwords, request bodies of auth endpoints, or hashes.
- Verify with the library's constant-time compare. Re-hash on sign-in when the parameters are raised.
- Passwords only travel over HTTPS and are never returned by any endpoint.
- The demo store in the browser uses PBKDF2-SHA-256 (310,000 iterations, random salt) through Web Crypto for the same reason. It is not a substitute for server-side hashing.

## 4. Generic error for wrong credentials

- Wrong email, wrong username, unknown account or wrong password **all** return the same response: `401` with `{ "error": "invalid_credentials" }`. The app shows **"Incorrect email, username or password."**
- Keep response time the same whether or not the account exists: run a dummy hash comparison for unknown accounts.
- Registration must not reveal existing accounts either. For a taken email or username, return a generic `409`/`422` with `{ "error": "register_failed" }`, or, preferably, accept the request and send an email to the existing address.
- Password reset always answers "If an account exists, we've sent an email".

## API contract used by the app

| Endpoint | Request body | Success | Errors |
|---|---|---|---|
| `POST /api/auth/login` | `{ identifier, password }`, where `identifier` is the normalised email or username | `200` with the `User` JSON, and sets an `httpOnly; Secure; SameSite=Lax` session cookie | `401 invalid_credentials`; `429 locked` with `lockedUntil`; `422` for malformed input |
| `POST /api/auth/register` | `{ name, email, username?, password }` | `201` with the `User` JSON and the session cookie | `409/422 register_failed` |
| `POST /api/auth/logout` | none | `204` and clears the cookie | none |

Session cookies rotate on sign-in. State-changing requests are protected against CSRF (SameSite plus a CSRF token or Origin check). Admin roles additionally require 2FA (`require2faForAdmins`).

## Acceptance checks before launch

1. Sending `<script>`, control characters or a 10,000-character value in any auth field returns `422` and stores nothing.
2. Five wrong passwords lock the account and the IP for 2 hours. A sixth attempt with the correct password still returns `429`.
3. The database contains only `$argon2id$…` strings in the password column.
4. A wrong password and an unknown email return identical status, body and (within noise) timing.
