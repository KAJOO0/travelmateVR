import { defineFunction } from '@aws-amplify/backend';

export const submitApplicationFn = defineFunction({
  name: 'submit-partner-application',
  entry: './handler.ts'
});
