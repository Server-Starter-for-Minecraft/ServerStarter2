import { BrowserWindow, dialog } from 'electron';
import { DialogOptions } from '../../schema/dialog';
import { Failable } from '../../util/error/failable';
import {
  CustomMapData,
  DatapackData,
  ModData,
  NewFileData,
  PluginData,
} from '../../schema/filedata';
import { errorMessage } from '../../util/error/construct';
import { datapackFiles } from './files/addtional/datapack';
import { Path } from 'app/src-electron/util/path';
import { pluginFiles } from './files/addtional/plugin';
import { modFiles } from './files/addtional/mod';

export function pickDialog(windowGetter: () => BrowserWindow | undefined) {
  async function result(
    options: { type: 'datapack'; isFile: boolean } & DialogOptions
  ): Promise<Failable<NewFileData<DatapackData>>>;
  async function result(
    options: { type: 'world'; isFile: boolean } & DialogOptions
  ): Promise<Failable<CustomMapData>>;
  async function result(
    options: { type: 'plugin' } & DialogOptions
  ): Promise<Failable<NewFileData<PluginData>>>;
  async function result(
    options: { type: 'mod' } & DialogOptions
  ): Promise<Failable<NewFileData<ModData>>>;
  async function result(
    options: {
      type: 'datapack' | 'world' | 'plugin' | 'mod';
      isFile?: boolean;
    } & DialogOptions
  ): Promise<
    Failable<NewFileData<DatapackData | PluginData | ModData> | CustomMapData>
  > {
    const window = windowGetter();

    // windowがない場合キャンセル状態の値を返す(Windowから呼ぶことを想定しているので、たぶん起こらない)
    if (!window) return errorMessage.data.path.dialogCanceled();

    const props: Electron.OpenDialogOptions['properties'] = [];

    const isFile = options.isFile ?? false;
    if (!isFile) props.push('openDirectory');

    const result = await dialog.showOpenDialog(window, {
      properties: props,
      title: options.title,
      defaultPath: options.defaultPath,
      buttonLabel: options.buttonLabel,
      message: options.message,
    });

    // キャンセルされた場合
    if (!result.canceled) return errorMessage.data.path.dialogCanceled();

    // 選択ファイル数が0である場合(たぶん起こらない)
    if (result.filePaths.length === 0)
      return errorMessage.data.path.dialogCanceled();

    const path = new Path(result.filePaths[0]);

    // typeに応じて結果を変える
    switch (options.type) {
      case 'world':
        const result: CustomMapData = {
          kind: 'map',
          path: path.path,
        };
        return result;
      case 'datapack':
        return datapackFiles.loadNew(path);
      case 'plugin':
        return pluginFiles.loadNew(path);
      case 'mod':
        return modFiles.loadNew(path);
    }
  }
  return result;
}
