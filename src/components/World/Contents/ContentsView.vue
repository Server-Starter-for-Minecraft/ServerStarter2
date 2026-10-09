<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
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
import SsInput from 'src/components/util/base/ssInput.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import ViewStyleToggle from 'src/components/util/ViewStyleToggle.vue';
import { ContentType, useContentActions } from './contentActions';
import { filterContents } from './contentFilter';
import { ContentPickOption, getImportActions } from './contentImport';
import ContentListItem from './ContentListItem.vue';
import ContentsSectionHeader from './ContentsSectionHeader.vue';
import ItemCardView from './itemCardView.vue';

type T = DatapackData | PluginData | ModData;

interface Prop {
  contentType: ContentType;
}
const prop = defineProps<Prop>();

const sysStore = useSystemStore();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();
const { reloadContents, reloading } = useContentActions();
const { t } = useI18n();

/** 追加コンテンツの検索ワード */
const searchText = ref('');

/** 表示形式（リスト表示かカード表示か） */
const isListView = computed(
  () => sysStore.systemSettings.user.viewStyle.contents === 'list'
);

/** リスト表示時の左右の仕切りの初期位置（左側の幅の割合[%]） */
const DEFAULT_SPLIT_POS = 50;
const splitPos = ref(DEFAULT_SPLIT_POS);

/** 表示中の種別で使える新規導入ボタンの一覧 */
const importActions = computed(() => getImportActions(prop.contentType));

/**
 * 新規導入ボタン1つあたりに必要な幅[px]
 * （最も長い表示名である英語の「New install from Folder」とアイコンが1行に収まる幅）
 */
const IMPORT_BTN_MIN_WIDTH = 220;
/** 検索欄の行のうち、新規導入ボタン以外（検索欄・再読み込み・表示切替）に確保する幅[px] */
const TOOLBAR_RESERVED_WIDTH = 450;
/** 検索欄の行の幅[px] */
const toolbarWidth = ref(Infinity);
/**
 * 新規導入ボタンを（ラベルを省いた）アイコンのみで表示するか
 * 検索欄の行にボタンの表示名まで収まらない場合はアイコンとTooltipで表示する
 */
const isCompactImportBtn = computed(
  () =>
    toolbarWidth.value - TOOLBAR_RESERVED_WIDTH <
    importActions.value.length * IMPORT_BTN_MIN_WIDTH
);

/** サーバー起動中に、変更の反映に再起動が必要な旨を表示するか */
const needReboot = computed(
  () =>
    consoleStore.status(mainStore.selectedWorldID) !== 'Stop' &&
    prop.contentType !== 'datapack'
);

/** 種別名を埋め込む文言（「追加済み〇〇」など）に渡すi18n引数 */
const typeLabelArg = computed(() => ({
  type: t(`additionalContents.${prop.contentType}`),
}));

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
 * ダイアログで選んだ追加コンテンツを新規導入する
 *
 * @param option 新規導入ボタンに対応するダイアログのオプション
 */
async function importNewContent(option: ContentPickOption) {
  // invokePickDialogは種別ごとに戻り値の型が異なるオーバーロードのため、
  // 種別で絞り込んでから呼び出す（オプションの中身はそのまま渡す）
  switch (option.type) {
    case 'datapack':
      checkError(
        await window.API.invokePickDialog(option),
        (c) => addContent2World(c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
    case 'plugin':
      checkError(
        await window.API.invokePickDialog(option),
        (c) => addContent2World(c),
        (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
      );
      break;
    case 'mod':
      checkError(
        await window.API.invokePickDialog(option),
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
  <div class="column no-wrap fit q-px-md">
    <h1 class="q-py-xs">
      {{ $t('additionalContents.management', typeLabelArg) }}
    </h1>

    <!-- 検索欄の行：両方の表示形式で共通の新規導入ボタンもここに並べる -->
    <div class="row no-wrap items-center q-pb-sm toolbar">
      <q-resize-observer @resize="(s) => (toolbarWidth = s.width)" />
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
      <!-- 幅が足りない場合は、ラベルを省いてアイコンとTooltipで表示する -->
      <q-btn
        v-for="action in importActions"
        :key="action.key"
        outline
        no-caps
        color="primary"
        class="import-btn"
        @click="importNewContent(action.pickOption)"
      >
        <q-icon :name="action.icon" />
        <q-icon v-if="isCompactImportBtn" name="add" size="1rem" />
        <span v-else class="q-ml-sm">{{ $t(action.labelKey) }}</span>
        <SsTooltip
          v-if="isCompactImportBtn"
          :name="$t(action.labelKey)"
          anchor="bottom middle"
          self="top middle"
        />
      </q-btn>
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
    <!-- 左右の一覧の開始位置が揃うよう、注意書きは両区画の外に表示する -->
    <p v-if="needReboot" class="text-caption text-negative q-mt-none q-mb-sm">
      {{ $t('additionalContents.needReboot') }}
    </p>

    <!-- リスト表示：プレイヤー画面と同様に、左に「〇〇を追加」、右に「追加済み〇〇」を並べる -->
    <q-splitter
      v-if="isListView"
      v-model="splitPos"
      @dblclick="splitPos = DEFAULT_SPLIT_POS"
      :limits="[25, 75]"
      emit-immediately
      separator-style="margin-left: 10px; margin-right: 10px"
      class="col q-pb-md"
      style="min-height: 0"
    >
      <template #before>
        <ContentsSectionHeader
          :label="$t('additionalContents.add', typeLabelArg)"
          :folder-label="
            $t('additionalContents.openAllSaveLocation', typeLabelArg)
          "
          @open-folder="openCacheFolder"
        />
        <p
          v-if="searchText && newContents.length === 0"
          class="q-my-lg text-center text-h5"
          style="opacity: 0.6"
        >
          {{ $t('additionalContents.noMatch') }}
        </p>
        <q-list v-else separator>
          <ContentListItem
            v-for="item in newContents"
            :key="fileDataKey(item)"
            :content-type="contentType"
            :content="item"
          />
        </q-list>
      </template>

      <template #after>
        <ContentsSectionHeader
          :label="$t('additionalContents.installed', typeLabelArg)"
          :folder-label="
            $t('additionalContents.openSaveLocation', typeLabelArg)
          "
          @open-folder="openSavedFolder"
        />
        <q-list v-if="installedContents.length > 0" separator>
          <ContentListItem
            v-for="item in installedContents"
            :key="fileDataKey(item)"
            :content-type="contentType"
            :content="item"
            is-delete
          />
        </q-list>
        <p v-else class="q-my-lg text-center text-h5" style="opacity: 0.6">
          {{
            searchText
              ? $t('additionalContents.noMatch')
              : $t('additionalContents.notInstalled', typeLabelArg)
          }}
        </p>
      </template>
    </q-splitter>

    <!-- カード表示：「追加済み〇〇」の下に「〇〇を追加」を並べる -->
    <q-scroll-area v-else class="col">
      <ContentsSectionHeader
        :label="$t('additionalContents.installed', typeLabelArg)"
        :folder-label="$t('additionalContents.openSaveLocation', typeLabelArg)"
        @open-folder="openSavedFolder"
      />
      <div v-if="installedContents.length > 0" class="row q-gutter-md q-pa-sm">
        <div v-for="item in installedContents" :key="fileDataKey(item)">
          <ItemCardView :content-type="contentType" is-delete :content="item" />
        </div>
      </div>
      <p v-else class="q-my-lg text-center text-h5" style="opacity: 0.6">
        {{
          searchText
            ? $t('additionalContents.noMatch')
            : $t('additionalContents.notInstalled', typeLabelArg)
        }}
      </p>

      <q-separator class="q-my-md" />

      <ContentsSectionHeader
        :label="$t('additionalContents.add', typeLabelArg)"
        :folder-label="
          $t('additionalContents.openAllSaveLocation', typeLabelArg)
        "
        @open-folder="openCacheFolder"
      />
      <p
        v-if="searchText && newContents.length === 0"
        class="q-my-lg text-center text-h5"
        style="opacity: 0.6"
      >
        {{ $t('additionalContents.noMatch') }}
      </p>
      <div v-else class="row q-gutter-sm q-pa-sm">
        <div v-for="item in newContents" :key="fileDataKey(item)">
          <ItemCardView :content-type="contentType" :content="item" />
        </div>
      </div>
    </q-scroll-area>
  </div>
</template>

<style scoped lang="scss">
.toolbar {
  gap: 8px;
}

.import-btn {
  flex-shrink: 0;
}
</style>
