import { SystemSettings } from 'app/src-electron/schema/system';
import { PlayerGroupConv } from './converters/playerGroup';

// 変換器を追加する場合はここを追記する
const converters = [new PlayerGroupConv()];

export function setFrontSys(sys: SystemSettings) {
  converters.forEach((conv) => {
    conv.setSysStore(sys);
  });
}

export function setBackSys(sys: SystemSettings) {
  converters.forEach((conv) => {
    sys = conv.setSysSettings(sys);
  });
  return sys
}
