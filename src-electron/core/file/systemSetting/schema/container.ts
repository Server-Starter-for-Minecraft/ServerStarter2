import { Array, ArrayFixMode } from '../../base/fixer/array';
import { Object } from '../../base/fixer/object';
import { Boolean, String } from '../../base/fixer/primitive';

export type Container$1 = {
  container: string;
  visible: boolean;
  name: string;
};

export const Container$1 = Object<Container$1>({
  container: String,
  visible: Boolean.default(true),
  name: String,
});

export type ContainersSettings$1 = Container$1[];

export const ContainersSettings$1 = Array<Container$1>(
  Container$1,
  ArrayFixMode.Skip
).default([]);
