import { defineStorage } from '@aws-amplify/backend';
import { submitApplicationFn } from '../functions/submit-partner-application/resource';
import { updatePartnerProfileFn } from '../functions/update-partner-profile/resource';

// Partner/tour-operator certification documents. 'partner-docs/{entity_id}/*' scopes each
// applicant to their own prefix (entity_id resolves to the caller's Cognito Identity Pool
// identity id, not the User Pool sub — a different id for the same session, but both are
// deterministic per signed-in user). Deliberately NOT allow.authenticated: per this package's
// own type docs, an authenticated/guest grant collapses {entity_id} to a wildcard, which would
// let any signed-in user read or overwrite every other applicant's documents.
export const storage = defineStorage({
  name: 'partnerDocs',
  access: allow => ({
    'partner-docs/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.groups(['admin']).to(['read']),
      // The submit-partner-application function verifies every attached document really
      // exists in S3 before accepting a submission — it needs read access across every
      // applicant's prefix to do that, not just its own (functions have no identity of their
      // own for {entity_id} to resolve against).
      allow.resource(submitApplicationFn).to(['read'])
    ],
    // Raw 360° photo/video submissions (src/pages/business/VrPage.tsx). Stays private —
    // nothing in the app renders this back publicly; publishing to the real static
    // pano/video pipeline (scripts/build-videos.mjs) remains a manual ops step.
    'vr-media/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.groups(['admin']).to(['read'])
    ],
    // Profile/cover photos — accepted as public-read by design (src/pages/account's "my
    // data" docs flag this explicitly): the whole point is other people see them, same trust
    // level Partner.cover already has. The exact key isn't guessable/listed anywhere, just
    // not login-gated.
    'profile-media/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
      // update-partner-profile verifies a claimed logo/cover key really exists before
      // writing it onto the public Partner row — needs read across every identity's prefix
      // for the same reason submitApplicationFn does on partner-docs/*.
      allow.resource(updatePartnerProfileFn).to(['read'])
    ]
  })
});
