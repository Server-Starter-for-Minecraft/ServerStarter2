import { defineStore } from 'pinia';
import { propertyClasses } from 'src/components/World/Property/classifications';
import { useSystemStore } from './SystemStore';
import { OpLevel, Player, PlayerSetting } from 'app/src-electron/schema/player';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { checkError } from 'src/components/Error/Error';
import { asyncFilter } from 'src/scripts/objFillter';
import { useMainStore } from './MainStore';
import { isValid } from 'src/scripts/error';

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
      cachePlayers: {} as Record<PlayerUUID, Player>,
      focusCards: new Set<PlayerUUID>(),
      selectedOP: undefined as OpLevel | 0 | undefined
    }
  },
  actions: {
    /**
     * プレイヤーの検索
     */
    searchPlayers<P extends PlayerSetting | Player>(players: P[]) {
      // TODO: Playersを名前でソート
      if (this.searchName !== '') {
        return players.filter(p => p.name.toLowerCase().match(this.searchName))
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
        this.focusCards.delete(uuid)
      }
      else {
        this.focusCards = new Set<PlayerUUID>()
      }
    },
    /**
     * プレイヤーに対するフォーカスを追加
     */
    addFocus(uuid: PlayerUUID) {
      this.focusCards.add(uuid)
      this.selectedOP = undefined
    },
    /**
     * グループを選択した際の処理
     * グループメンバーの追加とフォーカスの調整
     */
    selectGroup(groupName: string) {
      const mainStore = useMainStore()
      const groupMembers = this.searchGroups()[groupName].players
      
      if (isValid(mainStore.world.players)) {
        const worldPlayers = mainStore.world.players
        const notRegisteredMembers = groupMembers.filter(mUUID => !worldPlayers.some(p => p.uuid === mUUID))

        mainStore.world.players.push(...notRegisteredMembers.map(uuid => {return {uuid: uuid, name: this.cachePlayers[uuid].name}}))
      }
      
      // グループプレイヤー全員にFocusを当てる
      groupMembers.forEach(uuid => this.focusCards.add(uuid))
    },
    /**
     * プレイヤーをワールドのプレイヤー一覧へ追加＆プレイヤーの新規登録を行う
     */
    addPlayer(player: Player) {
      const sysStore = useSystemStore()
      const mainStore = useMainStore()

      // プレイヤーをワールドに追加
      // TODO: 実装の最適化（PlayersをSet型にする？）
      if (isValid(mainStore.world.players)) {
        if (!mainStore.world.players.includes(player)) {
          mainStore.world.players.push(player)
        }
      }
    
      // 新規プレイヤー特有の処理
      if (!(player.uuid in this.cachePlayers)) {
        // 未登録の新規プレイヤーをシステムに登録
        sysStore.systemSettings().player.players.push(player.uuid)
  
        // プレイヤーのキャッシュデータに新規プレイヤーを追加
        this.cachePlayers[player.uuid] = player
      }
    }
  }
});