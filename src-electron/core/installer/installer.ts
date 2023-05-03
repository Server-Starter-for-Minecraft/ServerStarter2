import { Failable, isFailure, isSuccess } from 'app/src-electron/api/failable';
import {
  FileData,
  FolderData,
  NewData,
  WorldAdditional,
  WorldEditedAdditional,
} from 'app/src-electron/api/schema';
import { asyncMap } from 'app/src-electron/util/objmap';
import { Path } from 'app/src-electron/util/path';
import { installDatapacks } from './datapack';

// TODO: 一度使用したmod/plugin/datapackを別の場所に保管しておく

export async function installAdditional(
  additional: WorldEditedAdditional,
  cwdPath: Path
): Promise<[WorldAdditional, Failable<undefined>]> {
  let failureMessages: string[] = [];

  // データパックの導入
  const datapacks = await installDatapacks(
    additional.datapacks,
    cwdPath.child('world/datapacks'),
    failureMessages
  );

  const failureCount = failureMessages.length;
  let failure: Failable<undefined> =
    failureCount === 0
      ? undefined
      : failureCount === 1
      ? new Error(failureMessages[0])
      : new Error(
          'multiple error occurred on installeing additional files:' +
            failureMessages.join(', ')
        );

  return [
    {
      datapacks,
    },
    failure,
  ];
}
