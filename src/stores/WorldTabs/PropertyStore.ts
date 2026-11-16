import { defineStore } from 'pinia';
import { keys } from 'app/src-public/scripts/obj/obj';
import { uniqueArray } from 'app/src-public/scripts/obj/objFillter';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { $T, $TE } from 'src/i18n/utils/tFunc';
import { useSystemStore } from 'src/stores/SystemStore';
import {
  getGroupProperties,
  getPropertyDescription,
  getPropertyGroups,
  isNotYetIntroduced,
} from 'src/components/World/Property/propertyDefinitions';

const disableProperties = ['level-name'];

export const usePropertyStore = defineStore('propertyStore', {
  state: () => {
    return {
      searchName: '',
      /** 選択中のタブの識別子 */
      selectTab: 'base',
    };
  },
  getters: {
    /**
     * 表示するタブの識別子
     *
     * 選択中のタブが無い場合（外部リソースの更新でタブが無くなった場合など）は先頭のタブとする
     */
    activeTab(state): string {
      const groups = getPropertyGroups(
        useSystemStore().outerResources.serverProperties,
        '',
        () => ''
      );
      return groups.some((g) => g.id === state.selectTab)
        ? state.selectTab
        : groups[0].id;
    },
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
      const resource = sysStore.outerResources.serverProperties;
      const order = sysStore.vanillaVersionOrder;

      /**
       * 表示しないプロパティか
       *
       * ワールドのバージョンにまだ存在しないプロパティは，値が無い場合に既定値で補わないよう表示しない
       */
      const isHidden = (prop: string) =>
        disableProperties.includes(prop) ||
        (!Object.hasOwn(targetProps, prop) &&
          isNotYetIntroduced(resource, prop, versionId, order));

      const getPropertyList = (searchName: string, selectTab: string) => {
        // 検索欄に文字が入った場合は該当するプロパティ全てを返す
        if (searchName !== '') {
          // タイトルの検索
          const searchTitles = keys(targetProps).filter((prop) =>
            prop.match(searchName)
          );
          // 説明文の検索（外部リソースの説明文を優先し，なければアプリ内の説明文）
          const searchDescs = keys(targetProps).filter((prop) =>
            getPropertyDescription(
              resource,
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
        // タブごとのプロパティを返す
        return getGroupProperties(resource, selectTab, keys(targetProps));
      };

      return uniqueArray(
        getPropertyList(this.searchName, this.activeTab)
      ).filter((prop) => !isHidden(prop));
    },
    /**
     * 引数で指定したグループが選択（フォーカス）されているか否か
     */
    selectPropertyTab(groupName: string) {
      return this.activeTab === groupName;
    },
  },
});
