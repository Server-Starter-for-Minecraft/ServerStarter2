import { DatapackContainer } from '../source/datapack/datapack';
import { ServerContainer } from '../source/server/server';
import { datapackSourcePath, serverSourcePath } from './const';

/**
 * coreが必要とするsourceの初期化を行う
 */

export const datapackContainer = new DatapackContainer(datapackSourcePath);
export const serverContainer = new ServerContainer(serverSourcePath);
