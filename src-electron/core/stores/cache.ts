import { cachePath } from '../const';

const ADDITIONALS_CACHE_PATH = cachePath.child('additionals');

export const DATAPACK_CACHE_PATH = ADDITIONALS_CACHE_PATH.child('datapack');

export const PLUGIN_CACHE_PATH = ADDITIONALS_CACHE_PATH.child('plugin');

export const MOD_CACHE_PATH = ADDITIONALS_CACHE_PATH.child('mod');
