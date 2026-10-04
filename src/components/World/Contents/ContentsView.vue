<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { getCssVar } from 'quasar';
import {
  AllFileData,
  CacheFileData,
  DatapackData,
  fileDataKey,
  ModData,
  NewFileData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import { tError } from 'src/i18n/utils/tFunc';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { checkError } from 'src/components/Error/Error';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import ViewStyleToggle from 'src/components/util/ViewStyleToggle.vue';
import { useContentActions } from './contentActions';
import { filterContents } from './contentFilter';
import ContentListItem from './ContentListItem.vue';
import ItemCardView from './itemCardView.vue';

type T = DatapackData | PluginData | ModData;

interface Prop {
  contentType: 'datapack' | 'plugin' | 'mod';
}
const prop = defineProps<Prop>();

const sysStore = useSystemStore();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();
const { reloadContents, reloading } = useContentActions();

/** 追加コンテンツの検索ワード */
const searchText = ref('');

/** 表示形式（リスト表示かカード表示か） */
const isListView = computed(
  () => sysStore.systemSettings.user.viewStyle.contents === 'list'
);

/** 検索ワードで絞り込んだ、表示中のワールドに導入済みの追加コンテンツ */
const installedContents = computed(() =>
  filterContents(
    (mainStore.world?.additional[`${prop.contentType}s`] ??
      []) as AllFileData<T>[],
    searchText.value
  )
);
/** 検索ワードで絞り込んだ、導入履歴のある未導入の追加コンテンツ */
const newContents = computed(() =>
  filterContents(
    getNewContents(mainStore.world?.additional[`${prop.contentType}s`]),
    searchText.value
  )
);

// 画面を開いた時と表示するワールドを切り替えた時に、
// 保存先のフォルダに直接追加・削除された追加コンテンツを反映する
onMounted(reloadContents);
watch(() => mainStore.selectedWorldID, reloadContents);

/**
 * キャッシュされたコンテンツのうち、導入済みのコンテンツを除外した一覧
 */
function getNewContents(worldContents?: AllFileData<T>[]) {
  return (
    sysStore.cacheContents[`${prop.contentType}s`] as CacheFileData<T>[]
  ).filter(
    (c) => !worldContents?.some((wc) => fileDataKey(wc) === fileDataKey(c))
  );
}

/**
 * コンテンツを新規導入
 */
async function importNewContent(isFile = false) {
  // エラー回避のため、意図的にswitchで分岐して表現を分かりやすくしている
  switch (prop.contentType) {
    case 'datapack':
      checkError(
        await window.API.invokePickDialog({ type: 'datapack', isFile: isFile }),
        (c) => addContent2World(c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
    case 'plugin':
      checkError(
        await window.API.invokePickDialog({ type: 'plugin' }),
        (c) => addContent2World(c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
    case 'mod':
      checkError(
        await window.API.invokePickDialog({ type: 'mod' }),
        (c) => addContent2World(c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
  }
}

/**
 * コンテンツを各種データベースに登録
 */
function addContent2World(content: NewFileData<T>) {
  function NewFile2CacheFile(): CacheFileData<T> {
    if (content.kind === 'datapack') {
      return {
        kind: 'datapack',
        description: content.description,
        type: 'system',
        name: content.name,
        ext: content.ext,
        isFile: content.isFile,
      };
    } else {
      return {
        kind: content.kind,
        type: 'system',
        name: content.name,
        ext: content.ext,
        isFile: content.isFile,
      };
    }
  }
  (
    mainStore.world?.additional[`${prop.contentType}s`] as AllFileData<T>[]
  ).push(content);
  (sysStore.cacheContents[`${prop.contentType}s`] as CacheFileData<T>[]).push(
    NewFile2CacheFile()
  );
}

/**
 * 保存済みデータのフォルダを開く
 */
async function openSavedFolder() {
  const path = await window.API.invokeGetWorldPaths(
    mainStore.selectedWorldID,
    `${prop.contentType}s`
  );

  checkError(
    path,
    async (p) => {
      const res = await window.API.sendOpenFolder(p, true);
      checkError(res, undefined, (e) => tError(e));
    },
    (e) => tError(e)
  );
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

    <div class="row items-center q-gutter-sm q-pb-sm">
      <SsInput
        v-model="searchText"
        dense
        clearable
        :placeholder="$t('additionalContents.search')"
        class="col"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </SsInput>
      <q-btn
        dense
        flat
        round
        icon="refresh"
        :loading="reloading"
        @click="reloadContents"
      >
        <SsTooltip
          :name="$t('additionalContents.reload')"
          anchor="bottom middle"
          self="top middle"
        />
      </q-btn>
      <ViewStyleToggle target="contents" />
    </div>

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
        @click="openSavedFolder"
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
    <template v-if="installedContents.length > 0">
      <q-list v-if="isListView" separator class="q-pa-sm">
        <ContentListItem
          v-for="item in installedContents"
          :key="fileDataKey(item)"
          :content-type="contentType"
          :content="item"
          is-delete
        />
      </q-list>
      <div v-else class="row q-gutter-md q-pa-sm">
        <div
          v-for="item in installedContents"
          :key="fileDataKey(item)"
          class="col-"
        >
          <ItemCardView :content-type="contentType" is-delete :content="item" />
        </div>
      </div>
    </template>
    <div v-else class="full-width">
      <p class="q-my-lg text-center text-h5" style="opacity: 0.6">
        {{
          searchText
            ? $t('additionalContents.noMatch')
            : $t('additionalContents.notInstalled', {
                type: $t(`additionalContents.${contentType}`),
              })
        }}
      </p>
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
          @click="importNewContent(true)"
          :card-style="{
            'border-radius': '6px',
            'border-color': getCssVar('primary'),
          }"
          class="text-primary"
        />
      </div>
      <div v-if="contentType === 'datapack'">
        <AddContentsCard
          :label="$t('additionalContents.installFromFolder')"
          min-height="4rem"
          @click="importNewContent(false)"
          :card-style="{
            'border-radius': '6px',
            'border-color': getCssVar('primary'),
          }"
          class="text-primary"
        />
      </div>
      <template v-if="!isListView">
        <div v-for="item in newContents" :key="fileDataKey(item)">
          <ItemCardView :content-type="contentType" :content="item" />
        </div>
      </template>
    </div>
    <q-list v-if="isListView" separator class="q-pa-sm">
      <ContentListItem
        v-for="item in newContents"
        :key="fileDataKey(item)"
        :content-type="contentType"
        :content="item"
      />
    </q-list>
  </div>
</template>

<style scoped lang="scss">
.folderBtn {
  border-color: transparent;
}
</style>
