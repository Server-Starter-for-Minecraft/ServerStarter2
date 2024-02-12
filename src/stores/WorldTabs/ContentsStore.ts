import { defineStore } from 'pinia';
import { WorldID } from 'app/src-electron/schema/world';
import {
  AllFileData,
  DatapackData,
  ModData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import { isExistKey } from 'src/scripts/obj';
import { useMainStore } from '../MainStore';
import { isContentsExists } from 'src/components/World/Contents/contentsPage';

type Contents = DatapackData | ModData | PluginData;

export const useContentsStore = defineStore('contentsStore', {
  state: () => {
    return {
      selectedTab: 'datapack' as 'datapack' | 'plugin' | 'mod',
      newContents: {} as Record<WorldID, Set<string>>,
    };
  },
  actions: {
    /**
     * 追加コンテンツページで表示するコンテンツの種類
     */
    getShowingContentPage() {
      const mainStore = useMainStore();
      this.selectedTab = isContentsExists[mainStore.world.version.type][
        this.selectedTab
      ]
        ? this.selectedTab
        : 'datapack';
      return this.selectedTab;
    },
    /**
     * ワールド起動前に追加されたコンテンツを記録
     */
    async setNewContents(worldID: WorldID, contents: AllFileData<Contents>) {
      if (!isExistKey(this.newContents, worldID)) {
        this.newContents[worldID] = new Set<string>();
      }

      this.newContents[worldID].add(await getHashData(contents));
    },
    /**
     * 当該コンテンツがワールド起動前に登録されたものか否かをチェック
     */
    async isNewContents(worldID: WorldID, contents: AllFileData<Contents>) {
      return (
        isExistKey(this.newContents, worldID) &&
        this.newContents[worldID].has(await getHashData(contents))
      );
    },
  },
});

async function getHashData(contents: AllFileData<Contents>) {
  const uint8  = new TextEncoder().encode(JSON.stringify(contents))
  const digest = await crypto.subtle.digest('SHA-256', uint8)
  return Array.from(new Uint8Array(digest)).map(v => v.toString(16).padStart(2,'0')).join('')
}
