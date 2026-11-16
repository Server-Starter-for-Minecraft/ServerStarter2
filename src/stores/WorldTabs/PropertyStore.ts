import { defineStore } from 'pinia';
import { keys } from 'app/src-public/scripts/obj/obj';
import { uniqueArray } from 'app/src-public/scripts/obj/objFillter';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { $T, $TE } from 'src/i18n/utils/tFunc';
import { useSystemStore } from 'src/stores/SystemStore';
import { pGroupKey } from 'src/components/World/Property/classifications';
import {
  getGroupProperties,
  getPropertyDescription,
  isClassifiedProperty,
  isRemovedProperty,
} from 'src/components/World/Property/propertyDefinitions';

const disableProperties = ['level-name'];

export const usePropertyStore = defineStore('propertyStore', {
  state: () => {
    return {
      searchName: '',
      selectTab: 'base' as pGroupKey,
    };
  },
  actions: {
    /**
     * プロパティの検索
     *
     * @param targetProps 表示するワールド（または標準設定）のプロパティ
     * @param versionId ワールドの Minecraft のバージョン（ワールドに依らない設定では指定しない）
     */
    searchProperties(targetProps: ServerProperties, versionId?: string) {
      const sysStore = useSystemStore();
      const definitions = sysStore.outerResources.serverProperties;
      const order = sysStore.vanillaVersionOrder;

      /** 表示しないプロパティか（廃止されたプロパティは，値が無い場合に既定値で補わないよう表示しない） */
      const isHidden = (prop: string) =>
        disableProperties.includes(prop) ||
        (targetProps[prop] === undefined &&
          isRemovedProperty(definitions?.[prop], versionId, order));

      function getPropertyList(searchName: string, selectTab: pGroupKey) {
        // 検索欄に文字が入った場合は該当するプロパティ全てを返す
        if (searchName !== '') {
          // タイトルの検索
          const searchTitles = keys(targetProps).filter((prop) =>
            prop.match(searchName)
          );
          // 説明文の検索（外部リソースの説明文を優先し，なければアプリ内の説明文）
          const searchDescs = keys(targetProps).filter((prop) =>
            getPropertyDescription(
              definitions,
              prop,
              sysStore.systemSettings.user.language,
              (key) => {
                const i18nKey = `property.description['${key}']`;
                return $TE(i18nKey) ? $T(i18nKey) : undefined;
              }
            )?.match(searchName)
          );
          return searchTitles.concat(searchDescs);
        }
        // グループごとのプロパティを返す
        else {
          if (selectTab === 'other') {
            return keys(targetProps).filter(
              (k) => !isClassifiedProperty(definitions, k)
            );
          } else {
            return getGroupProperties(definitions, selectTab);
          }
        }
      }

      return uniqueArray(
        getPropertyList(this.searchName, this.selectTab)
      ).filter((prop) => !isHidden(prop));
    },
    /**
     * 引数で指定したグループが選択（フォーカス）されているか否か
     */
    selectPropertyTab(groupName: pGroupKey) {
      return this.selectTab === groupName;
    },
  },
});
