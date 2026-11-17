import { defineStore } from 'pinia';
import { keys } from 'app/src-public/scripts/obj/obj';
import { uniqueArray } from 'app/src-public/scripts/obj/objFillter';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { $T, $TE } from 'src/i18n/utils/tFunc';
import { useSystemStore } from 'src/stores/SystemStore';
import {
  getCandidateProperties,
  getGroupProperties,
  getPropertyDescription,
  getPropertyGroups,
  isUnavailableInVersion,
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
       * ワールドのバージョンで存在しないプロパティは，server.properties に値があっても表示しない（値はファイルに残す）
       * （新規ワールドは標準プロパティをすべて持ち，入力欄の表示時にも既定値が入るため，値の有無では判定しない）
       */
      const isHidden = (prop: string) =>
        disableProperties.includes(prop) ||
        isUnavailableInVersion(resource, prop, versionId, order);

      const getPropertyList = (searchName: string, selectTab: string) => {
        // 検索欄に文字が入った場合は該当するプロパティ全てを返す
        if (searchName !== '') {
          // タブに表示しうるプロパティ（値の無い定義済みのプロパティを含む）を検索する
          const candidates = getCandidateProperties(
            resource,
            keys(targetProps)
          );
          // タイトルの検索
          const searchTitles = candidates.filter((prop) =>
            prop.match(searchName)
          );
          // 説明文の検索（外部リソースの説明文を優先し，なければアプリ内の説明文）
          const searchDescs = candidates.filter((prop) =>
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
