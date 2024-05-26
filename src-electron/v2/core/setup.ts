/**
 * coreが必要とするsourceの初期化を行う
 */
import { DatapackContainer } from '../source/datapack/datapack';
import { datapackSourcePath } from './const';

export const datapackContainer = new DatapackContainer(datapackSourcePath);
