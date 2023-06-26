import { defineStore } from 'pinia';
import { propertyClasses } from 'src/components/World/Property/classifications';
import { useSystemStore } from './SystemStore';
import { PlayerSetting } from 'app/src-electron/schema/player';

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
      return Object.keys(propertyClasses).filter(
        gKey => this.searchProperties(gKey).length !== 0
      )
    },
    /**
     * 引数で指定したグループが選択（フォーカス）されているか否か
     */
    selectPropertyTab(groupName: string) {
      const groups = this.propertyTabs()

      if (groups.includes(this.selectTab)) {
        return this.selectTab === groupName
      }
      else {
        this.selectTab = groups[0]
        return this.selectTab === groups[0]
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