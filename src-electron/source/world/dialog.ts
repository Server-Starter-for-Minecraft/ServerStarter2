import { BrowserWindow, dialog } from 'electron';
import { WorldContainer } from 'app/src-electron/schema/brands';
import { BytesData } from 'app/src-electron/util/binary/bytesData';
import { Path } from 'app/src-electron/util/binary/path';
import { isError } from 'app/src-electron/util/error/error';
import { DialogOptions } from '../../schema/dialog';
import {
  BackupData,
  CustomMapData,
  DatapackData,
  ImageURIData,
  ModData,
  NewFileData,
  PluginData,
} from '../../schema/filedata';
import { BACKUP_DIRECTORY_NAME, BACKUP_EXT } from '../../source/const';
import { errorMessage } from '../../util/error/construct';
import { Failable } from '../../util/error/failable';
import { datapackFiles } from '../additionalContents/datapack/datapack';
import { modFiles } from '../additionalContents/mod/mod';
import { pluginFiles } from '../additionalContents/plugin/plugin';
import { parseBackUpPath } from './backup';
import { loadCustomMap } from './customMap';
import { worldContainerToPath } from './worldContainer';

async function pickImage(path: Path): Promise<Failable<ImageURIData>> {
  const data = await BytesData.fromPath(path);
  if (isError(data)) return data;
  return {
    kind: 'image',
    path: path.str(),
    data: await data.encodeURI('image/png'),
  };
}

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
    options: { type: 'image' } & DialogOptions
  ): Promise<Failable<ImageURIData>>;
  async function result(
    options: { type: 'container' } & DialogOptions
  ): Promise<Failable<WorldContainer>>;
  async function result(
    options: { type: 'backup'; container: WorldContainer } & DialogOptions
  ): Promise<Failable<BackupData>>;
  async function result(
    options: {
      type:
        | 'datapack'
        | 'world'
        | 'plugin'
        | 'mod'
        | 'image'
        | 'container'
        | 'backup';
      isFile?: boolean;
      container?: WorldContainer;
    } & DialogOptions
  ): Promise<
    Failable<
      | NewFileData<DatapackData | PluginData | ModData>
      | CustomMapData
      | ImageURIData
      | WorldContainer
      | BackupData
    >
  > {
    const window = windowGetter();

    // windowがない場合キャンセル状態の値を返す(Windowから呼ぶことを想定しているので、たぶん起こらない)
    if (!window) return errorMessage.data.path.dialogCanceled();

    const props: Electron.OpenDialogOptions['properties'] = [];

    const filters: Electron.FileFilter[] = [];

    let defaultPath: undefined | Path = undefined;

    // 拡張子制約を設ける
    switch (options.type) {
      case 'image':
        filters.push({
          extensions: ['png'],
          name: 'image',
        });
        break;
      case 'mod':
      case 'plugin':
        filters.push({
          extensions: ['jar', 'zip'],
          name: 'jar/zip',
        });
        break;
      case 'datapack':
      case 'world':
        if (options.isFile) {
          filters.push({
            extensions: ['zip'],
            name: 'zip',
          });
        }
        break;
      case 'container':
        options.isFile = false;
        break;
      case 'backup':
        // バックアップはssbackup形式(中身はtar.gz)
        filters.push({
          extensions: [BACKUP_EXT],
          name: BACKUP_EXT,
        });
        // バックアップフォルダを開く
        if (options.container) {
          defaultPath = worldContainerToPath(options.container).child(
            BACKUP_DIRECTORY_NAME
          );
          props.push('dontAddToRecent');
        }
        break;
    }

    const isFile = options.isFile ?? true;
    props.push(isFile ? 'openFile' : 'openDirectory');

    // ファイル選択ダイアログを開く
    const result = await dialog.showOpenDialog(window, {
      properties: props,
      title: options.title,
      defaultPath: defaultPath?.str(),
      buttonLabel: options.buttonLabel,
      message: options.message,
      filters,
    });

    // キャンセルされた場合
    if (result.canceled) return errorMessage.data.path.dialogCanceled();

    // 選択ファイル数が0である場合(たぶん起こらない)
    if (result.filePaths.length === 0)
      return errorMessage.data.path.dialogCanceled();

    const path = new Path(result.filePaths[0]);

    // typeに応じて結果を変える
    switch (options.type) {
      case 'world':
        return loadCustomMap(path);
      case 'datapack':
        return datapackFiles.loadNew(path);
      case 'plugin':
        return pluginFiles.loadNew(path);
      case 'mod':
        return modFiles.loadNew(path);
      case 'image':
        return pickImage(path);
      case 'container':
        return path.str() as WorldContainer;
      case 'backup':
        return parseBackUpPath(path);
    }
  }
  return result;
}
