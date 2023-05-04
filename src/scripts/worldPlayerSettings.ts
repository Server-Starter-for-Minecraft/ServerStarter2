import {
  PlayerGroupSetting,
  PlayerSetting,
} from 'app/src-electron/schema/player';
import { useWorldEditStore } from 'src/stores/WorldEditStore';

const worldEditStore = useWorldEditStore();

/** ワールドのプレイヤー一覧を編集可能かどうかにかかわらず取得 */
export function GetAllPlayers(player: PlayerSetting) {
  player;
}

/** ワールドの編集可能プレイヤー一覧にプレイヤー追加する */
export function AddPlayer(player: PlayerSetting) {
  player;
}

/** ワールドのプレイヤーが編集可能かどうかを設定する */
export function SetPlayerEditable(player: PlayerSetting, editable: boolean) {
  worldEditStore.world.players;
}

/** ワールドのプレイヤーを編集可能かどうかにかかわらず削除 */
export function RemovePlayer(player: PlayerSetting) {}

/** ワールドにプレイヤーグループを追加 */
export function AddPlayerGroup(group: PlayerGroupSetting) {}

/** ワールドからプレイヤーグループを削除 */
export function RemovePlayerGroup(group: PlayerGroupSetting) {}
