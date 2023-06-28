import { ErrorTranslation, FlattenErrors } from './base';
import { CoreErrors } from './core';
import { DataErrors } from './data';
import { SystemErrors } from './system';
import { ValueErrors } from './value';

export type ErrorMessageTypes = {
  system: SystemErrors;
  data: DataErrors;
  value: ValueErrors;
  core: CoreErrors;
};

export type FlattenErrorMessageTypes = FlattenErrors<ErrorMessageTypes>;
export type ErrorTranslationTypes = ErrorTranslation<ErrorMessageTypes>;