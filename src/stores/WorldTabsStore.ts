import { defineStore } from 'pinia';
import { propertyClasses } from 'src/components/World/Property/classifications';

export const usePropertyStore = defineStore('propertyStore', {
  state: () => {
    return {
      searchName: '',
      selectTab: 'base'
    }
  },
  actions: {
    /**
     * プロパティの検索
     * TODO: otherグループが選択されたときの特例処理　＆　翻訳がない場合の特例処理
     */
    searchProperties(groupName?: string) {
      const propClassName = groupName ?? this.selectTab

      if (this.searchName !== '') {
        return propertyClasses[propClassName].filter(
          (prop) => prop.match(this.searchName)
        );
      }

      return propertyClasses[propClassName];
    },
    /**
     * Property設定の左側にあるグループ一覧
     */
    propertyTabs() {
      return Object.keys(propertyClasses).filter(
        gKey => this.searchProperties(gKey).length !== 0
      )
    },
    /**
     * 引数で指定したグループが選択（フォーカス）されているか否か
     */
    selectPropertyTab(groupName: string) {
      const groups = this.propertyTabs()

      if (groups.includes(this.selectTab)) {
        return this.selectTab === groupName
      }
      else {
        this.selectTab = groups[0]
        return this.selectTab === groups[0]
      }
    }
  }
});


export const useConsoleStore = defineStore('consoleStore', {
  state: () => {
    return {
      consoleLines: new Array<string>()
    }
  }
});

