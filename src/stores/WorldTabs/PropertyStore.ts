import { defineStore } from 'pinia';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { pGroupKey, propertyClasses } from 'src/components/World/Property/classifications';
import { keys, values } from 'src/scripts/obj';
import { $T, tError } from 'src/i18n/utils/tFunc';
import { WorldID } from 'app/src-electron/schema/world';
import { useWorldStore } from '../MainStore';
import { checkError } from 'src/components/Error/Error';

const disableProperties = ['level-name']

export const usePropertyStore = defineStore('propertyStore', {
  state: () => {
    return {
      searchName: '',
      selectTab: 'base' as pGroupKey
    }
  },
  actions: {
    /**
     * プロパティの検索
     */
    searchProperties(targetProps: ServerProperties) {
      // 検索欄に文字が入った場合は該当するプロパティ全てを返す
      if (this.searchName !== '') {
        // タイトルの検索
        const searchTitles = keys(targetProps).filter(
          prop => prop.match(this.searchName)
        )
        // 説明文の検索
        const searchDescs = keys(targetProps).filter(
          prop => $T(`property.description['${prop}']`).match(this.searchName)
        )
        return searchTitles.concat(searchDescs)
      }
      // グループごとのプロパティを返す
      else {
        if (this.selectTab === 'other') {
          const classifiedKeies = values(propertyClasses).flat()
          return keys(targetProps).filter(k => !classifiedKeies.includes(k) && !disableProperties.includes(k))
        }
        else {
          return propertyClasses[this.selectTab]
        }
      }
    },
    /**
     * 引数で指定したグループが選択（フォーカス）されているか否か
     */
    selectPropertyTab(groupName: pGroupKey) {
      return this.selectTab === groupName
    },
    /**
     * サーバーポート番号を書き換えて登録する
     */
    setServerPort(worldID: WorldID, port: number) {
      const worldStore = useWorldStore()
      checkError(
        worldStore.worldList[worldID].properties,
        p => p['server-port'] = port,
        e => tError(e)
      )
    }
  }
});