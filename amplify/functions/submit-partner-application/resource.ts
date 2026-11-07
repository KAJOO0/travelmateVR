import { defineFunction } from '@aws-amplify/backend';

export const submitApplicationFn = defineFunction({
  name: 'submit-partner-application',
  entry: './handler.ts',
  // Without this, the function gets its own nested stack, and granting it write access to
  // the PartnerApplication table (amplify/backend.ts) creates a cycle: Data's stack already
  // depends on this function (as submitPartnerApplication's resolver), and the function's
  // stack would then depend back on Data's table ARN - confirmed live
  // (CloudformationStackCircularDependencyError naming storage/data/function together).
  // Pinning the function into the data stack itself removes the second, back-pointing edge.
  resourceGroupName: 'data'
});
