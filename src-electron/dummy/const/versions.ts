import { Version } from '../../schema/version';
import fabric from './fabric-all.json';
import forge from './forge-all.json';
import mohistmc from './mohistmc-all.json';
import papermc from './papermc-all.json';
import spigot from './spigot-all.json';
import vanilla from './vanilla-all.json';

export const dummyVersionMap = {
  fabric: fabric as Version[],
  forge: forge as Version[],
  mohistmc: mohistmc as Version[],
  papermc: papermc as Version[],
  spigot: spigot as Version[],
  vanilla: vanilla as Version[],
};
