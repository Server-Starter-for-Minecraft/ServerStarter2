import { fromEntries, values } from 'app/src-public/scripts/obj/obj';
import { genUUID } from 'app/src-public/scripts/uuid';
import { UUID } from 'app/src-electron/schema/brands';
import { PlayerGroup } from 'app/src-electron/schema/player';
import { SystemSettings } from 'app/src-electron/schema/system';
import { getConvertTargetStore } from 'src/stores/SystemStore';
import { Converter } from './base';

export type BackPlayerGroup = { [name in string]: PlayerGroup };
export type FrontPlayerGroup = { [key in UUID]: PlayerGroup };

/**
 * backendが持っているプレイヤーグループのKeyをUUIDに変更して返す
 */
export class PlayerGroupConv extends Converter<
  FrontPlayerGroup,
  BackPlayerGroup
> {
  setSysStore(sys: SystemSettings): void {
    const sysStore = getConvertTargetStore();
    sysStore.playerGroups = this.toFront(sys.player.groups);
  }
  protected toFront(sys: BackPlayerGroup): FrontPlayerGroup {
    return fromEntries(values(sys).map((g) => [genUUID(), g]));
  }
  protected fromFront(sys: FrontPlayerGroup): BackPlayerGroup {
    return fromEntries(values(sys).map((g) => [g.name, g]));
  }
  setSysSettings(sys: SystemSettings): SystemSettings {
    const sysStore = getConvertTargetStore();
    sys.player.groups = this.fromFront(sysStore.playerGroups);
    return sys;
  }
}
