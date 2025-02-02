import { z } from 'zod';

export const OsPlatform = z.enum([
  'debian',
  'redhat',
  'mac-os',
  'mac-os-arm64',
  'windows-x64',
]);
export type OsPlatform = z.infer<typeof OsPlatform>;
