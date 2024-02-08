import { fixArray, ArrayFixMode } from '../../base/fixer/array';
import { fixObject } from '../../base/fixer/object';
import { fixBoolean, fixString } from '../../base/fixer/primitive';

export type Container$1 = {
  container: string;
  visible: boolean;
  name: string;
};

export const Container$1 = fixObject<Container$1>({
  container: fixString,
  visible: fixBoolean.default(true),
  name: fixString,
});

export type AppContainersSettings$1 = Container$1[];

export const defaultAppContainersSettings$1: AppContainersSettings$1 = [
  {
    container: './servers',
    name: 'servers',
    visible: true,
  },
];

export const AppContainersSettings$1 = fixArray<Container$1>(
  Container$1,
  ArrayFixMode.Skip
)
  // 一つもコンテナが存在しない場合は defaultContainersSettings$1 を設定する
  .map((x) => (x.length === 0 ? defaultAppContainersSettings$1 : x))
  .default(defaultAppContainersSettings$1);
