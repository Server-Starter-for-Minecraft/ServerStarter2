import { ServerProperty } from 'app/src-electron/schema/serverproperty';
import { World } from 'app/src-electron/schema/world';
import { defineStore } from 'pinia';
import { deepCopy } from 'src/scripts/deepCopy';

type PropertyRows = { name: string; value: ServerProperty }[];

export const useWorldEditStore = defineStore('worldEditStore', {
  state: () => {
    return {
      worldIndex: -1,
      world: {} as World,
      title: '',
      saveFunc: () => {
        return;
      },
      propertyRows: [] as PropertyRows,
    };
  },
  actions: {
    /**
     * World Editページを起動するにあたり必要なデータの受け渡し
     */
    setEditer(
      world: World,
      saveFunc: () => void,
      { worldIndex = -1, title = 'ワールド編集' }
    ) {
      this.world = world;
      this.worldIndex = worldIndex;
      this.title = title;
      this.saveFunc = saveFunc;
    },
    /**
     * Propertyがない場合はデフォルトを適用し、ある場合はある項目だけ参照して他の項目はDefaultを適用させる
     */
    async setfirstProperty() {
      const _defaultServerProperties = deepCopy(
        (await window.API.invokeGetDefaultSettings()).properties
      );

      if (this.world.properties !== void 0) {
        for (const key in this.world.properties) {
          _defaultServerProperties[key] = this.world.properties[key];
        }
      }

      return _defaultServerProperties;
    },
    /**
     * Property tableの値を元のWorldの値に更新する
     */
    async updateRows() {
      this.propertyRows = Object.entries(await this.setfirstProperty()).map(
        ([name, value]) => ({ name, value })
      );
    },
  },
});
