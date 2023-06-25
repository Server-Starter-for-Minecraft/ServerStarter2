import { defineStore } from 'pinia';
import { propertyClasses } from 'src/components/World/Property/classifications';
import { useSystemStore } from './SystemStore';
import { PlayerSetting } from 'app/src-electron/schema/player';

// TODO: 将来的にnameはclassifications.tsから取得し、labelはi18nからnameをkeyとして取得
const groupNames = [
  {
    name: 'base',
    label: '基本設定'
  },
  {
    name: 'player',
    label: 'プレイヤー'
  },
  {
    name: 'server',
    label: 'サーバー'
  },
  {
    name: 'generater',
    label: 'ワールド生成'
  },
  {
    name: 'spawning',
    label: 'ワールドスポーン'
  },
  {
    name: 'world',
    label: 'ワールド本体'
  },
  {
    name: 'network',
    label: 'ネットワーク'
  },
  {
    name: 'rcon-query',
    label: 'RCON / Query'
  },
  {
    name: 'command',
    label: 'コマンド'
  },
  {
    name: 'resourcepack',
    label: 'リソースパック'
  },
  {
    name: 'security',
    label: 'セキュリティ'
  },
  {
    name: 'other',
    label: 'その他'
  }
]

export const usePropertyStore = defineStore('propertyStore', {
  state: () => {
    return {
      searchName: '',
      selectTab: 'base'
    }
  },
  actions: {
    /**
     * プロパティの検索
     */
    searchProperties(groupName?: string) {
      const propClassName = groupName ?? this.selectTab
      
      if (this.searchName !== '') {
        return propertyClasses[propClassName].filter(
          (prop) => prop.match(this.searchName)
        );
      }
      
      return propertyClasses[propClassName];
    },
    /**
     * Property設定の左側にあるグループ一覧
     */
    propertyTabs() {
      return groupNames.filter(
        g => this.searchProperties(g.name).length !== 0
      )
    },
    /**
     * 引数で指定したグループが選択（フォーカス）されているか否か
     */
    selectPropertyTab(groupName: string) {
      const groups = this.propertyTabs()

      if (groups.map(g => g.name).includes(this.selectTab)) {
        return this.selectTab === groupName
      }
      else {
        this.selectTab = groups[0].name
        return this.selectTab === groups[0].name
      }
    }
  }
});


export const useConsoleStore = defineStore('consoleStore', {
  state: () => {
    return {
      consoleLines: new Array<string>()
    }
  }
});


export const usePlayerStore = defineStore('playerStore', {
  state: () => {
    return {
      searchName: '',
      focusCards: [] as string[]
    }
  },
  actions: {
    /**
     * プレイヤーの検索
     */
    searchPlayers(players: PlayerSetting[]) {
      const sysStore = useSystemStore()
      const playersData = sysStore.systemSettings().player.players

      if (this.searchName !== '') {
        return players.filter(
          player => playersData.filter(p => p.uuid === player.uuid)[0].name.match(this.searchName)
        );
      }
      
      return players;
    },
    /**
     * プレイヤーグループの検索
     */
    searchGroups() {
      const sysStore = useSystemStore()
      const groupsData = sysStore.systemSettings().player.groups
      
      if (this.searchName !== '') {
        return groupsData.filter(g => g.name.match(this.searchName))
      }
      
      return groupsData;
    },
  }
});