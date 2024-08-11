import { datapackSourcePath, serverSourcePath } from '../common/paths';
import { DatapackContainer } from '../source/datapack/datapack';
import { ServerContainer } from '../source/server/server';

/**
 * coreが必要とするsourceの初期化を行う
 */

export const datapackContainer = new DatapackContainer(datapackSourcePath);
export const serverContainer = new ServerContainer(serverSourcePath);
