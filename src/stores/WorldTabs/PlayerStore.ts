import { defineStore } from 'pinia';
import { createNewName } from 'app/src-public/scripts/createNewName';
import { isValid } from 'app/src-public/scripts/error';
import { fromEntries, toEntries, values } from 'app/src-public/scripts/obj/obj';
import { genUUID } from 'app/src-public/scripts/uuid';
import { PlayerUUID, UUID } from 'app/src-electron/schema/brands';
import { OpLevel, Player, PlayerGroup } from 'app/src-electron/schema/player';
import { useMainStore } from '../MainStore';
import { useSystemStore } from '../SystemStore';

export const usePlayerStore = defineStore('playerStore', {
  state: () => {
    return {
      focusCards: new Set<PlayerUUID>(),
      selectedGroupId: '' as UUID,
      openGroupEditor: false,
    };
  },
  actions: {
    /**
     * プレイヤーグループの検索
     */
    searchGroups(searchName: string) {
      const sysStore = useSystemStore();
      const groupsData = sysStore.systemSettings.player.groups;

      if (searchName !== '') {
        fromEntries(
          toEntries(groupsData).filter(([k, v]) => v.name.match(searchName))
        );
      }

      return groupsData;
    },
    /**
     * グループを名前から探す
     */
    findGroupfromName(name: string) {
      return toEntries(this.searchGroups(name))
        .map(([id, g]) => g)
        .find((g) => g.name === name);
    },
    /**
     * プレイヤーに対するフォーカスを解除
     */
    unFocus(uuid?: PlayerUUID) {
      if (uuid !== void 0) {
        this.focusCards.delete(uuid);
      } else {
        this.focusCards = new Set<PlayerUUID>();
      }
    },
    /**
     * プレイヤーに対するフォーカスを追加
     */
    addFocus(uuid?: PlayerUUID) {
      if (uuid !== void 0) {
        this.focusCards.add(uuid);
      } else {
        const mainStore = useMainStore();
        if (mainStore.world && isValid(mainStore.world.players)) {
          mainStore.world.players.forEach((p) => this.focusCards.add(p.uuid));
        }
      }
    },
    /**
     * グループを選択した際の処理
     * グループメンバーの追加とフォーカスの調整
     */
    async selectGroup(groupName: string) {
      const mainStore = useMainStore();
      const groupObj = this.findGroupfromName(groupName);
      if (groupObj === void 0) return;
      const groupMembers = groupObj.players;

      // グループメンバーがワールドに登録されていなければ登録する
      if (mainStore.world && isValid(mainStore.world.players)) {
        const worldPlayers = mainStore.world.players;
        const notRegisteredMembers = groupMembers.filter(
          (mUUID) => !worldPlayers.some((p) => p.uuid === mUUID)
        );
        await Promise.all(
          notRegisteredMembers.map(async (mId) => {
            const p = await window.API.invokeGetPlayer(mId, 'uuid');
            if (isValid(p)) this.addPlayer(p);
          })
        );
      }

      // グループプレイヤー全員にFocusを当てる
      groupMembers.forEach((uuid) => this.focusCards.add(uuid));
    },
    /**
     * プレイヤーをワールドのプレイヤー一覧へ追加
     */
    addPlayer(player: Player) {
      const mainStore = useMainStore();

      // プレイヤーをワールドに追加
      // TODO: 実装の最適化（PlayersをSet型にする？）
      if (mainStore.world && isValid(mainStore.world.players)) {
        if (!mainStore.world.players.find((p) => p.uuid === player.uuid)) {
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
      this.focusCards.forEach((selectedPlayerUUID) => {
        if (mainStore.world && isValid(mainStore.world.players)) {
          mainStore.world.players.splice(
            mainStore.world.players
              .map((p) => p.uuid)
              .indexOf(selectedPlayerUUID),
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
        players: [...this.focusCards],
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
    setOP(setVal: 0 | OpLevel) {
      const mainStore = useMainStore();

      if (mainStore.world && isValid(mainStore.world.players)) {
        const val =
          setVal !== 0
            ? { level: setVal, bypassesPlayerLimit: false }
            : undefined;

        mainStore.world.players
          .filter((p) => this.focusCards.has(p.uuid))
          .forEach((p) => {
            p.op = val;
          });
      }

      // フォーカスのリセット
      this.unFocus();
    },
  },
});
