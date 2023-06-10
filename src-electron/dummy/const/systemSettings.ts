import { Player } from 'app/src-electron/schema/player';
import { WorldContainer } from '../../schema/brands';
import { SystemSettings, WorldContainers } from '../../schema/system';
import { defaultServerProperties } from './serverProperties';
import { SystemWorldSettings } from 'app/src-electron/schema/world';

export const player1: Player = {
  name: 'player1',
  uuid: '8c4d8e1b-26b0-4e73-a8b2-f10d55e1c20c',
};

export const player2: Player = {
  name: 'player2',
  uuid: '5050fa2d-6a88-45da-b25e-7bcda267dfe2',
};

export const player3: Player = {
  name: 'player3',
  uuid: '8b3dfc8d-c75a-4e8a-86ba-8a0697b0942e',
};

export const dummySystemWorldSettings: SystemWorldSettings = {
  javaArguments: '',
  memory: { size: 2, unit: 'GB' },
  properties: defaultServerProperties,
};

export const serverWorldContainer = 'servers' as WorldContainer;

export const dummyWorldContainers: WorldContainers = {
  default: serverWorldContainer,
  custom: {
    test: 'testDirectory' as WorldContainer,
  },
};

export const dummySystemSettings: SystemSettings = {
  container: dummyWorldContainers,
  world: dummySystemWorldSettings,
  remote: {
    github: {
      accounts: [
        {
          owner: 'testOwner',
          repo: 'testRepo',
          pat: 'ghp-TESTETSTESTESTTESTETSTESTESTTESTETSTESTESTTESTETSTESTEST',
        },
      ],
    },
  },
  player: {
    groups: [
      {
        name: 'testGroup',
        players: [player1, player2, player3],
      },
    ],
    players: [player1, player2, player3],
  },
  user: {
    eula: true,
    language: 'ja',
    owner: player1,
    autoShutDown: false,
  },
  cache: {
    datapacks: [
      {
        name: '導入済み1',
        description: '説明文説明文説明文説明文説明文説明文'
      },
      {
        name: '導入済み2',
        description: '説明文説明文説明文説明文説明文説明文'
      },
      {
        name: '導入済み3',
        description: '説明文説明文説明文説明文説明文説明文'
      },
    ]
  }
};
