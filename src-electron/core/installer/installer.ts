import { Failable } from 'src-electron/api/failable';
import { Path } from 'src-electron/util/path';
import { installFiles } from './files';
import {
  WorldAdditional,
  WorldEditedAdditional,
} from 'src-electron/schema/world';

// TODO: 一度使用したmod/plugin/datapackを別の場所に保管しておく

export async function installAdditional(
  additional: WorldEditedAdditional,
  cwdPath: Path
): Promise<[WorldAdditional, Failable<undefined>]> {
  const failureMessages: string[] = [];

  // Datapackの導入
  const datapacksPromise = installFiles(
    additional.datapacks,
    cwdPath.child('world/datapacks'),
    failureMessages
  );

  // Pluginの導入
  const pluginsPromise = installFiles(
    additional.plugins,
    cwdPath.child('plugins'),
    failureMessages
  );

  // Modの導入
  const modsPromise = installFiles(
    additional.mods,
    cwdPath.child('mods'),
    failureMessages
  );

  const [datapacks, plugins, mods] = await Promise.all([
    datapacksPromise,
    pluginsPromise,
    modsPromise,
  ]);

  const failureCount = failureMessages.length;
  const failure: Failable<undefined> =
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
      plugins,
      mods,
    },
    failure,
  ];
}
