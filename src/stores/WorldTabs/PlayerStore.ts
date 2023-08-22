import { watch } from 'vue';
import { defineStore } from 'pinia';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { OpLevel, Player, PlayerGroup, PlayerSetting } from 'app/src-electron/schema/player';
import { isValid } from 'src/scripts/error';
import { useSystemStore } from '../SystemStore';
import { useMainStore } from '../MainStore';

type GroupSettings = PlayerGroup & { isNew: boolean }

export const usePlayerStore = defineStore('playerStore', {
  state: () => {
    return {
      searchName: '',
      cachePlayers: {} as Record<PlayerUUID, Player>,
      focusCards: new Set<PlayerUUID>(),
      selectedOP: undefined as OpLevel | 0 | undefined,
      newPlayerCandidate: undefined as Player | undefined,
      selectedGroup: {} as GroupSettings,
      selectedGroupName: '',
      openGroupEditor: false
    }
  },
  actions: {
    /**
     * プレイヤーの検索
     */
    searchPlayers<P extends PlayerSetting | Player>(players: P[]) {
      let returnPlayers = players

      if (this.searchName !== '') {
        returnPlayers = players.filter(
          p => p.name.toLowerCase().match(this.searchName)
        )
      }

      return returnPlayers;
    },
    /**
     * プレイヤーグループの検索
     */
    searchGroups() {
      const sysStore = useSystemStore()
      const groupsData = sysStore.systemSettings.player.groups

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

        mainStore.world.players.push(...notRegisteredMembers.map(uuid => { return { uuid: uuid, name: this.cachePlayers[uuid].name } }))
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
        if (!mainStore.world.players.find(p => p.uuid === player.uuid)) {
          mainStore.world.players.push(player)
        }
      }

      // 新規プレイヤー特有の処理
      if (!(player.uuid in this.cachePlayers)) {
        // 未登録の新規プレイヤーをシステムに登録
        sysStore.systemSettings.player.players.push(player.uuid)

        // プレイヤーのキャッシュデータに新規プレイヤーを追加
        this.cachePlayers[player.uuid] = player
      }

      // 検索欄をリセット
      this.searchName = ''
    }
  }
});

export function setPlayerSearchSubscriber(store: ReturnType<typeof usePlayerStore>) {
  watch(() => store.searchName, async (newVal, oldVal) => {
    const player = await window.API.invokeGetPlayer(newVal, 'name')
    store.newPlayerCandidate = isValid(player) ? player : undefined
  })
}