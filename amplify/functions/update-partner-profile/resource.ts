import { defineFunction } from '@aws-amplify/backend';

export const updatePartnerProfileFn = defineFunction({
  name: 'update-partner-profile',
  entry: './handler.ts',
  // Same reason as submitApplicationFn: this function is both an AppSync resolver and needs
  // direct table access, and leaving it in its own default stack reproduces the exact
  // circular-CloudFormation-dependency class already hit once this session (data <-> storage
  // <-> function).
  resourceGroupName: 'data'
});
