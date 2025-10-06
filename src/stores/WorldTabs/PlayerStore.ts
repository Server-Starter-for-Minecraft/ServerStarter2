import { defineStore } from 'pinia';
import { createNewName } from 'app/src-public/scripts/createNewName';
import { isValid } from 'app/src-public/scripts/error';
import { toEntries, values } from 'app/src-public/scripts/obj/obj';
import { genUUID } from 'app/src-public/scripts/uuid';
import { PlayerUUID, UUID } from 'app/src-electron/schema/brands';
import {
  OpLevel,
  OpSetting,
  Player,
  PlayerGroup,
} from 'app/src-electron/schema/player';
import { useMainStore } from '../MainStore';
import { useSystemStore } from '../SystemStore';

// フォーカスされているプレイヤーのUUID一覧とUUIDからPlayerオブジェクトへのマッピング
// (storeに直接持たせると責任分担が不明確となり，任意の箇所から値の変更をかけられてしまうため，外部に切り出す)
const __focusPlayerIds: Set<PlayerUUID> = new Set();
const __playerFromId: Record<PlayerUUID, Player> = {};

const setFocusPlayer = (player: Player) => {
  __playerFromId[player.uuid] = player;
  __focusPlayerIds.add(player.uuid);
};

export const usePlayerStore = defineStore('playerStore', {
  state: () => {
    return {
      selectedGroupId: '' as UUID,
      openGroupEditor: false,
    };
  },
  getters: {
    focusPlayerIds(): Set<PlayerUUID> {
      return __focusPlayerIds;
    },
    focusPlayers(): Player[] {
      return Array.from(this.focusPlayerIds).map((id) => __playerFromId[id]);
    },
  },
  actions: {
    /**
     * グループを名前から探す
     */
    findGroupfromName(name: string) {
      const sysStore = useSystemStore();
      return toEntries(sysStore.systemSettings.player.groups)
        .map(([id, g]) => g)
        .find((g) => g.name === name);
    },
    /**
     * プレイヤーに対するフォーカスを解除
     */
    unFocus(player?: Player) {
      if (player !== void 0) {
        __focusPlayerIds.delete(player.uuid);
      } else {
        __focusPlayerIds.clear();
      }
    },
    /**
     * プレイヤーに対するフォーカスを追加
     *
     * TODO: Ctrl + a で表示中のプレイヤーをすべてFocusCardsに追加する処理に対応できる構造を検討
     */
    addFocus(player: Player) {
      setFocusPlayer(player);
    },
    /**
     * グループを選択した際の処理
     * グループメンバーの追加とフォーカスの調整
     */
    async selectGroup(groupName: string) {
      const mainStore = useMainStore();
      const groupObj = this.findGroupfromName(groupName);
      if (groupObj === void 0) return;

      // グループメンバーのUUIDからPlayerオブジェクトを取得
      const groupMembers = await Promise.all(
        groupObj.players.map((pId) => window.API.invokeGetPlayer(pId, 'uuid'))
      ).then((ps) => ps.filter(isValid));

      // グループメンバーを全員ワールドに登録する
      if (mainStore.world && isValid(mainStore.world.players)) {
        groupMembers.forEach((p) => this.addPlayer(p));
      }

      // グループプレイヤー全員にFocusを当てる
      groupMembers.forEach(this.addFocus);
    },
    /**
     * プレイヤーをワールドのプレイヤー一覧へ追加
     */
    addPlayer(player: Player) {
      const mainStore = useMainStore();

      // プレイヤーをワールドに追加
      if (mainStore.world && isValid(mainStore.world.players)) {
        const worldPlayerIds = new Set(
          mainStore.world.players.map((p) => p.uuid)
        );
        if (!worldPlayerIds.has(player.uuid)) {
          mainStore.world?.players.push(player);
        }
      }
    },
    /**
     * フォーカスされているプレイヤーを選択中のワールドから削除する
     */
    removePlayer() {
      const mainStore = useMainStore();

      // フォーカスされているプレイヤーを削除
      this.focusPlayerIds.forEach((uuid) => {
        if (mainStore.world && isValid(mainStore.world.players)) {
          mainStore.world.players.splice(
            mainStore.world.players.map((p) => p.uuid).indexOf(uuid),
            1
          );
        }
      });

      // フォーカスのリセット
      this.unFocus();
    },
    addGroup() {
      const sysStore = useSystemStore();
      const gid = genUUID();
      // 名前を決定
      const groupName = createNewName(
        values(sysStore.systemSettings.player.groups).map((g) => g.name),
        'NewGroup'
      );
      // 色を決定
      const colorCodes = values(sysStore.staticResouces.minecraftColors);
      const colorCode =
        colorCodes[Math.round(Math.random() * (colorCodes.length - 1))];
      // グループを生成
      sysStore.systemSettings.player.groups[gid] = {
        name: groupName,
        color: colorCode,
        players: Array.from(this.focusPlayerIds),
      };
      return gid;
    },
    updateGroup(
      groupID: UUID,
      groupUpdater: (group: PlayerGroup) => PlayerGroup
    ) {
      const sysStore = useSystemStore();
      sysStore.systemSettings.player.groups[groupID] = groupUpdater(
        sysStore.systemSettings.player.groups[groupID]
      );
    },
    removeGroup(groupID: UUID) {
      const sysStore = useSystemStore();
      delete sysStore.systemSettings.player.groups[groupID];
      this.unFocus();
    },
    /**
     * フォーカスされているプレイヤーに対してOPの設定を行う
     */
    setOp(setVal: 0 | OpLevel) {
      const focusIds = this.focusPlayerIds;
      function setter(setVal?: OpSetting) {
        const mainStore = useMainStore();
        if (mainStore.world && isValid(mainStore.world.players)) {
          mainStore.world.players
            .filter((p) => focusIds.has(p.uuid))
            .forEach((p) => {
              p.op = setVal;
            });
        }
      }

      // 設定するOPレベルに応じて適切な値を設定
      if (setVal === 0) {
        setter();
      } else {
        setter({ level: setVal, bypassesPlayerLimit: false });
      }

      // フォーカスのリセット
      this.unFocus();
    },
  },
});
