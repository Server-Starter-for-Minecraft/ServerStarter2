import { defineStore } from 'pinia';
import {
  AllFileData,
  DatapackData,
  ModData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import { isContentsExists } from 'src/components/World/Contents/contentsPage';
import { useMainStore } from '../MainStore';

type Contents = DatapackData | ModData | PluginData;

export const useContentsStore = defineStore('contentsStore', {
  state: () => {
    return {
      selectedTab: 'datapack' as 'datapack' | 'plugin' | 'mod',
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
     * 当該コンテンツがワールド起動前に登録されたものか否かをチェック
     */
    isNewContents(contents: AllFileData<Contents>) {
      const mainStore = useMainStore();
      return !mainStore.worldBack?.additional[`${this.selectedTab}s`].find(
        (c) => c.name === contents.name
      );
    },
  },
});
