// Cognito PreSignUp trigger (amplify/auth/resource.ts) — rejects sign-up with a known
// disposable/throwaway email domain (2026-11-08 audit #9). Only applies to real email+password
// sign-up (triggerSource 'PreSignUp_SignUp'); federated (Google) and admin-created users are
// left alone — a federated email belongs to the IdP's own verification, not this check.
import type { PreSignUpTriggerHandler } from 'aws-lambda';
import { DISPOSABLE_EMAIL_DOMAINS } from './disposable-domains';

export const handler: PreSignUpTriggerHandler = async (event) => {
  if (event.triggerSource === 'PreSignUp_SignUp') {
    const email = event.request.userAttributes.email ?? '';
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (domain && DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      throw new Error('Disposable email addresses are not accepted. Please use a permanent email address.');
    }
  }
  return event;
};
