import { AllVanillaVersion } from '../../../schema/version';
import { VersionListLoader } from './base';

export function getVanillaVersionLoader(): VersionListLoader<AllVanillaVersion> {
  return {
    getFromCache: () => {

    },
    getFromURL: () => {

    },
  };
}
