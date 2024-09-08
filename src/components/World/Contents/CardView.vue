<script setup lang="ts">
import { getCssVar } from 'quasar';
import {
  AllFileData,
  CacheFileData,
  DatapackData,
  ModData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import { tError } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { checkError } from 'src/components/Error/Error';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import ItemCard from './CardView/itemCard.vue';
import {
  ContentsType,
  importNewContent,
  openSavedFolder,
} from './contentsPage';

type T = DatapackData | PluginData | ModData;

interface Prop {
  contentType: ContentsType;
}
const prop = defineProps<Prop>();

const sysStore = useSystemStore();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

/**
 * キャッシュされたコンテンツのうち、導入済みのコンテンツを除外した一覧
 */
function getNewContents(worldContents?: AllFileData<T>[]) {
  return (
    sysStore.cacheContents[`${prop.contentType}s`] as CacheFileData<T>[]
  ).filter((c) => !worldContents?.map((wc) => wc.name).includes(c.name));
}

/**
 * キャッシュフォルダを開く
 */
async function openCacheFolder() {
  const res = await window.API.sendOpenFolder(
    sysStore.staticResouces.paths.cache[prop.contentType],
    true
  );
  checkError(res, undefined, (e) => tError(e));
}
</script>

<template>
  <div class="q-px-md">
    <h1 class="q-py-xs">
      {{
        $t('additionalContents.management', {
          type: $t(`additionalContents.${contentType}`),
        })
      }}
    </h1>

    <div class="row justify-between">
      <span class="text-caption">
        {{
          $t('additionalContents.installed', {
            type: $t(`additionalContents.${contentType}`),
          })
        }}
      </span>
      <q-btn
        dense
        flat
        :label="
          $t('additionalContents.openSaveLocation', {
            type: $t(`additionalContents.${contentType}`),
          })
        "
        icon="folder"
        color="grey"
        size=".7rem"
        @click="() => openSavedFolder(contentType)"
        class="folderBtn"
      />
    </div>
    <p
      v-if="
        consoleStore.status(mainStore.selectedWorldID) !== 'Stop' &&
        contentType !== 'datapack'
      "
      class="text-caption text-negative q-ma-none"
    >
      {{ $t('additionalContents.needReboot') }}
    </p>
    <div class="row q-gutter-md q-pa-sm">
      <template
        v-if="mainStore.world?.additional[`${contentType}s`].length ?? -1 > 0"
      >
        <div
          v-for="item in mainStore.world?.additional[`${contentType}s`]"
          :key="item.name"
          class="col-"
        >
          <ItemCard :content-type="contentType" is-delete :content="item" />
        </div>
      </template>
      <div v-else class="full-width">
        <p class="q-my-lg text-center text-h5" style="opacity: 0.6">
          {{
            $t('additionalContents.notInstalled', {
              type: $t(`additionalContents.${contentType}`),
            })
          }}
        </p>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <div class="row justify-between">
      <span class="text-caption">
        {{
          $t('additionalContents.add', {
            type: $t(`additionalContents.${contentType}`),
          })
        }}
      </span>
      <q-btn
        dense
        flat
        :label="
          $t('additionalContents.openAllSaveLocation', {
            type: $t(`additionalContents.${contentType}`),
          })
        "
        icon="folder"
        color="grey"
        size=".7rem"
        @click="openCacheFolder"
        class="folderBtn"
      />
    </div>
    <div class="row q-gutter-sm q-pa-sm">
      <div>
        <AddContentsCard
          :label="
            contentType === 'datapack'
              ? $t('additionalContents.installFromZip')
              : $t('additionalContents.newInstall')
          "
          min-height="4rem"
          @click="importNewContent(contentType, true)"
          :card-style="{
            'border-radius': '6px',
            'border-color': getCssVar('primary'),
          }"
          class="text-primary"
        />
      </div>
      <!-- 【Obsolete】仕様変更によってフォルダ構造のデータパックは導入不可となった -->
      <!-- <div v-if="contentType === 'datapack'">
        <AddContentsCard
          :label="$t('additionalContents.installFromFolder')"
          min-height="4rem"
          @click="importNewContent(contentType, false)"
          :card-style="{
            'border-radius': '6px',
            'border-color': getCssVar('primary'),
          }"
          class="text-primary"
        />
      </div> -->
      <div
        v-for="item in getNewContents(
          mainStore.world?.additional[`${contentType}s`]
        )"
        :key="item.name"
      >
        <ItemCard :content-type="contentType" :content="item" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.folderBtn {
  border-color: transparent;
}
</style>
