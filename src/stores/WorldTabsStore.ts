import { defineStore } from 'pinia';
import { propertyClasses } from 'src/components/World/Property/classifications';
import { useSystemStore } from './SystemStore';
import { OpLevel, PlayerSetting } from 'app/src-electron/schema/player';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { checkError } from 'src/components/Error/Error';
import { asyncFilter } from 'src/scripts/objFillter';

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
     * TODO: otherグループが選択されたときの特例処理　＆　翻訳がない場合の特例処理
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
      focusCards: [] as PlayerUUID[],
      selectedOP: undefined as OpLevel | 0 | undefined
    }
  },
  actions: {
    /**
     * プレイヤーの検索
     */
    async searchPlayers(players: PlayerSetting[]) {
      async function getPlayerName(uuid: PlayerUUID) {
        const player = await window.API.invokeGetPlayer(uuid, 'uuid')
        return checkError(player, undefined, 'プレイヤーの取得に失敗しました')?.name ?? ''
      }
      
      // TODO: Playersを名前でソート
      if (this.searchName !== '') {
        return await asyncFilter(players, async p => (await getPlayerName(p.uuid)).toLowerCase().match(this.searchName) !== null)
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
        return Object.fromEntries(Object.entries(groupsData).filter(([k, v]) => k.match(this.searchName)))
      }
      
      return groupsData;
    },
    /**
     * プレイヤーに対するフォーカスを解除
     */
    unFocus(uuid?: PlayerUUID) {
      if (uuid !== void 0) {
        this.focusCards.splice(this.focusCards.indexOf(uuid), 1)
      }
      else {
        this.focusCards = []
      }
    },
    /**
     * プレイヤーに対するフォーカスを追加
     */
    addFocus(uuid: PlayerUUID) {
      this.focusCards.push(uuid)
      this.selectedOP = undefined
    },
  }
});