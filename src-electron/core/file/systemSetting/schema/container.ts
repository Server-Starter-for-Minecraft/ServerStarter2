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

export type ContainersSettings$1 = Container$1[];

export const ContainersSettings$1 = fixArray<Container$1>(
  Container$1,
  ArrayFixMode.Skip
).default([]);
