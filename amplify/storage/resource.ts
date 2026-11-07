import { defineStorage } from '@aws-amplify/backend';
import { submitApplicationFn } from '../functions/submit-partner-application/resource';

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
    ]
  })
});
