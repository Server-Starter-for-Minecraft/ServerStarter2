import { FlattenErrors } from './base';
import { CoreErrors } from './core';
import { DataErrors } from './data';
import { LibErrors } from './lib';
import { SystemErrors } from './system';
import { ValueErrors } from './value';

export type ErrorMessageTypes = {
  system: SystemErrors;
  data: DataErrors;
  value: ValueErrors;
  core: CoreErrors;
  lib: LibErrors
};

export type FlattenErrorMessageTypes = FlattenErrors<ErrorMessageTypes>;
