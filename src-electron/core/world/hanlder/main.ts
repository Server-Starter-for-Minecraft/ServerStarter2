import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { WorldID } from 'app/src-electron/schema/world';

/** ローカルのワールドのデータの読み書きを操作するクラス */
export class WorldHandler {
  name: WorldName;
  container: WorldContainer;
  id: WorldID;

  constructor(name: WorldName, container: WorldContainer, id: WorldID) {
    this.id = id;
    this.container = container;
    this.name = name;
  }

  /** server_settings.json の内容を読み取る */
  async loadJson(){
    serverJsonFile.load(savePath),
  }
}
