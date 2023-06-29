import { Player } from 'app/src-electron/schema/player';
import { ImageURI, PlayerUUID, WorldContainer } from '../../schema/brands';
import { SystemSettings, WorldContainers } from '../../schema/system';
import { defaultServerProperties } from './serverProperties';
import { SystemWorldSettings } from 'app/src-electron/schema/world';

export const player1UUID = '8c4d8e1b-26b0-4e73-a8b2-f10d55e1c20c' as PlayerUUID;
export const player2UUID = '5050fa2d-6a88-45da-b25e-7bcda267dfe2' as PlayerUUID;
export const player3UUID = '8b3dfc8d-c75a-4e8a-86ba-8a0697b0942e' as PlayerUUID;

export const playerAvatar =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIBAMAAAA2IaO4AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAqUExURQAPLP3++Pb28+jo5b+QecaXfMmkjT8/PwCTINCqj9m+owJ3NTe6VGHBQ8rHOi0AAAAJcEhZcwAADsMAAA7DAcdvqGQAAAApSURBVBjTY0AAIUMlRQaVoGR1hohZUzcy5KxauZFh7qpVlxm0Vq1aBACCXAsTpdjxUAAAAABJRU5ErkJggg==' as ImageURI;
export const playerAvatarOverlay =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABXSURBVChTY2Tg1/nPQA6YUy2MX+PP6w4IBfnBsv9x6oi204JLNKWhKvr778d/pidvP0O5DAyPHwtAWRDg5OiOsAvZJBh48eLpf4Zv3z5jtxsIvn37/B8A3fAn0FlZxgwAAAAASUVORK5CYII=' as ImageURI;

export const player1: Player = {
  name: 'player1',
  uuid: player1UUID,
  avatar: playerAvatar,
  avatar_overlay: playerAvatarOverlay,
};

export const player2: Player = {
  name: 'player2',
  uuid: player2UUID,
  avatar: playerAvatar,
  avatar_overlay: playerAvatarOverlay,
};

export const player3: Player = {
  name: 'player3',
  uuid: player3UUID,
  avatar: playerAvatar,
  avatar_overlay: playerAvatarOverlay,
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
    groups: {
      'testGroup': {
        name: 'testGroup',
        color: '#ff0000',
        players: [player1UUID, player2UUID, player3UUID],
      },
    },
    players: {
      [player1UUID]: player1,
      [player2UUID]: player2,
      [player3UUID]: player3,
    },
  },
  user: {
    eula: true,
    language: 'ja',
    theme: 'auto',
    owner: player1,
    autoShutDown: false,
  },
  cache: {
    datapacks: [
      {
        name: '導入済み1',
        description: '説明文説明文説明文説明文説明文説明文',
      },
      {
        name: '導入済み2',
        description: '説明文説明文説明文説明文説明文説明文',
      },
      {
        name: '導入済み3',
        description: '説明文説明文説明文説明文説明文説明文',
      },
    ],
  },
};
