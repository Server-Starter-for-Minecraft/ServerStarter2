import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { PlayerSetting } from 'app/src-electron/schema/player';
import { World, WorldAbbr, WorldID } from 'app/src-electron/schema/world';
import { genUUID } from 'app/src-electron/tools/uuid';
import {
  dummySystemWorldSettings,
  player1,
  player2,
  player3,
} from './systemSettings';
import { defaultServerProperties } from './serverProperties';
import { dummyServerPropertiesMap } from './serverPropertiesMap';

const world1Id = '11111111-1111-1111-1111-111111111111' as WorldID;
const world2Id = '22222222-2222-2222-2222-222222222222' as WorldID;
const world3Id = '33333333-3333-3333-3333-333333333333' as WorldID;

const serverContainer = ' servers' as WorldContainer;

const world1Name = 'world1' as WorldName;
const world2Name = 'world2' as WorldName;
const world3Name = 'world3' as WorldName;

const world1Abbr: WorldAbbr = {
  avater_path: '',
  container: serverContainer,
  id: world1Id,
  name: world1Name,
};

const world2Abbr: WorldAbbr = {
  avater_path: '',
  container: serverContainer,
  id: world2Id,
  name: world2Name,
};

const world3Abbr: WorldAbbr = {
  avater_path: '',
  container: serverContainer,
  id: world3Id,
  name: world3Name,
};

export const dummyWorldAbbrs: WorldAbbr[] = [
  world1Abbr,
  world2Abbr,
  world3Abbr,
];

export const player1Setting: PlayerSetting = {
  ...player1,
  op: {
    bypassesPlayerLimit: true,
    level: 4,
  },
};

export const player2Setting: PlayerSetting = {
  ...player2,
  op: {
    bypassesPlayerLimit: false,
    level: 1,
  },
};
export const player3Setting: PlayerSetting = {
  ...player3,
};

const playerSettings = [player1Setting, player2Setting, player3Setting];

export const world1: World = {
  id: world1Id,
  name: world1Name,
  additional: {},
  container: serverContainer,
  memory: {
    size: 2,
    unit: 'GB',
  },
  players: playerSettings,
  properties: dummyServerPropertiesMap,
  using: false,
  version: {
    type: 'vanilla',
    id: '1.19.4',
    release: true,
  },
};

export const world2: World = {
  id: world2Id,
  name: world2Name,
  additional: {},
  container: serverContainer,
  memory: {
    size: 512,
    unit: 'MB',
  },
  players: playerSettings,
  properties: dummyServerPropertiesMap,
  using: false,
  version: {
    type: 'vanilla',
    id: '1.19.4',
    release: true,
  },
};

export const world3: World = {
  id: world3Id,
  name: world3Name,
  additional: {},
  container: serverContainer,
  memory: {
    size: 8,
    unit: 'GB',
  },
  players: playerSettings,
  properties: dummyServerPropertiesMap,
  using: false,
  version: {
    type: 'vanilla',
    id: '1.19.4',
    release: true,
  },
};

export const worldMap: Record<WorldID, World> = {};

worldMap[world1Id] = world1;
worldMap[world2Id] = world2;
worldMap[world3Id] = world3;
