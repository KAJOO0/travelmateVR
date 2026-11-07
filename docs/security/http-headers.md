# HTTP security headers

Applied via Amplify Hosting's app-level **custom headers** config (`UpdateApp`'s
`customHeaders` parameter, or Console → App settings → Hosting → Custom headers) — **not**
read from `amplify.yml` or any file in this repo. A `customHeaders` key inside `amplify.yml`
is silently ignored by the build system; this file exists purely so the configuration is
documented and reproducible if the app is ever recreated, not because it's live-synced.

If you need to change these, update them via the Console/API and update this file to match.

```yaml
customHeaders:
  - pattern: '**/*'
    headers:
      - key: 'Strict-Transport-Security'
        value: 'max-age=31536000; includeSubDomains'
      - key: 'X-Content-Type-Options'
        value: 'nosniff'
      - key: 'X-Frame-Options'
        value: 'DENY'
      - key: 'Referrer-Policy'
        value: 'strict-origin-when-cross-origin'
      - key: 'Permissions-Policy'
        value: 'camera=(), microphone=(), geolocation=(self)'
      - key: 'Content-Security-Policy'
        value: >-
          default-src 'self';
          script-src 'self' 'unsafe-inline';
          style-src 'self' 'unsafe-inline';
          img-src 'self' data: blob: https://tile.openstreetmap.org;
          font-src 'self' data:;
          connect-src 'self' https://*.appsync-api.eu-west-3.amazonaws.com wss://*.appsync-realtime-api.eu-west-3.amazonaws.com https://cognito-idp.eu-west-3.amazonaws.com https://cognito-identity.eu-west-3.amazonaws.com https://auth.travelmatevr.com;
          media-src 'self';
          object-src 'none';
          base-uri 'self';
          form-action 'self';
          frame-ancestors 'none';
      # Amplify Hosting's own default lets CloudFront's edge cache index.html for up to a
      # year (s-maxage), relying entirely on deploy-time invalidation reaching every edge
      # location before the next visitor hits it - confirmed live as unreliable: a brand-new
      # incognito browser got served an index.html from an older deploy, referencing JS chunk
      # files the newer deploy had already removed (404s on dynamic import, breaking the
      # whole page). no-cache doesn't mean "don't store" - it means every request must
      # revalidate with origin first, so this can never serve stale HTML again. The override
      # just below restores long-lived caching for the actual hashed, truly-immutable assets.
      - key: 'Cache-Control'
        value: 'no-cache, must-revalidate'
  - pattern: '/assets/**'
    headers:
      - key: 'Cache-Control'
        value: 'public, max-age=31536000, immutable'
  - pattern: '/account/**'
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
  - pattern: '/bookings/**'
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
  - pattern: '/trips/**'
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
  - pattern: '/wishlist'
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
  - pattern: '/notifications'
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
  - pattern: '/help/tickets/**'
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
  - pattern: '/business/**'
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
  - pattern: '/board/**'
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
  - pattern: '/admin/**'
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]
```

## Why these specific CSP choices

- `script-src`/`style-src` allow `'unsafe-inline'`: the app sets React inline `style={{...}}`
  at 500+ call sites, and `index.html` has one inline theme-flash-avoidance script. Tightening
  this to a nonce/hash build pipeline is a safe follow-up, deliberately not attempted here to
  avoid a live breakage from a mismatched hash.
- `connect-src` allow-lists Cognito + AppSync (the real backend, `eu-west-3`) plus the
  OpenStreetMap tile host (`src/components/map/MapView.tsx`'s default tile provider) and the
  custom Cognito Hosted UI domain (`auth.travelmatevr.com`) — the browser calls this domain's
  `/oauth2/token` endpoint directly to finish Google sign-in, so without it here that one
  fetch is silently blocked by this very policy (confirmed live: `TypeError: Failed to fetch`
  with a CSP violation logged for this exact host, even though Cognito/Google's own config was
  otherwise correct).
- `frame-ancestors 'none'` (CSP) and `X-Frame-Options: DENY` (legacy header) are intentionally
  redundant — nothing in this app needs to be iframe-embedded.

## Public vs. private routes

Public (stay indexable): home, `/destinations`, `/explore`, `/vr`, marketplace routes,
`/listing/*`, `/partner/*`, `/signin`, `/partners`, `/partners/join`, `/tourism-boards`,
`/creators`, legal/content pages.

Private (noindex): `/account/**`, `/bookings/**`, `/trips/**`, `/wishlist`, `/notifications`,
`/help/tickets/**`, `/business/**`, `/board/**`, `/admin/**`.
