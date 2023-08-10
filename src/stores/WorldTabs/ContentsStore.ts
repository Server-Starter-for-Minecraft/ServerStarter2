import { defineStore } from 'pinia';
import { useMainStore } from '../MainStore';
import { isContentsExists } from 'src/components/World/Contents/contentsPage';

export const useContentsStore = defineStore('contentsStore', {
  state: () => {
    return {
      selectedTab: 'datapack' as ('datapack' | 'plugin' | 'mod'),
    }
  },
  actions: {
    /**
     * 追加コンテンツページで表示するコンテンツの種類
     */
    getShowingContentPage() {
      const mainStore = useMainStore()
      this.selectedTab = isContentsExists[mainStore.world.version.type][this.selectedTab] ? this.selectedTab : 'datapack'
      return this.selectedTab
    }
  }
})