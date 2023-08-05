<script setup lang="ts">
import { getCssVar } from 'quasar';
import { AllFileData, CacheFileData, DatapackData, ModData, NewFileData, PluginData } from 'app/src-electron/schema/filedata';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { checkError } from 'src/components/Error/Error';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import ItemCardView from './itemCardView.vue';

type T = DatapackData | PluginData | ModData

interface Prop {
  contentType: 'datapack' | 'plugin' | 'mod'
}
const prop = defineProps<Prop>()

const sysStore = useSystemStore()
const mainStore = useMainStore()

/**
 * キャッシュされたコンテンツのうち、導入済みのコンテンツを除外した一覧
 */
function getNewContents(worldContents: AllFileData<T>[]) {
  return (sysStore.cacheContents[`${prop.contentType}s`] as CacheFileData<T>[]).filter(
    c => !worldContents.map(wc => wc.name).includes(c.name)
  )
}

/**
 * コンテンツを新規導入
 */
async function importNewContent() {
  // エラー回避のため、意図的にswitchで分岐して表現を分かりやすくしている
  switch (prop.contentType) {
    case 'datapack':
      // TODO: 導入するデータパックについて、isFile = false|true を選択できるUIの提供
      // TODO: 翻訳時にtypeのアルファベットは全て日本語（or 適切な表現）に変換する
      // TODO: 何もファイルを選択せずに修了した場合もエラー扱いとなるため、翻訳時にそのことを含意する文言に修正
      checkError(
        await window.API.invokePickDialog({type: 'datapack', isFile: true}),
        c => addContent2World(c),
        //"$t('additionalContents.installFailed')"
        () => { return { title: `${prop.contentType}の導入は行われませんでした` }}
      )
      break;
    case 'plugin':
      checkError(
        await window.API.invokePickDialog({type: 'plugin'}),
        c => addContent2World(c),
        () => { return { title: `${prop.contentType}の導入は行われませんでした` }}
      )
      break;
    case 'mod':
      checkError(
        await window.API.invokePickDialog({type: 'mod'}),
        c => addContent2World(c),
        () => { return { title: `${prop.contentType}の導入は行われませんでした` }}
      )
    default:
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
        isFile: content.isFile
      }
    }
    else {
      return {
        kind: content.kind,
        type: 'system',
        name: content.name,
        ext: content.ext,
        isFile: content.isFile
      }
    }
  }
  (mainStore.world.additional[`${prop.contentType}s`] as AllFileData<T>[]).push(content);
  (sysStore.cacheContents[`${prop.contentType}s`] as CacheFileData<T>[]).push(NewFile2CacheFile())
}

/**
 * キャッシュフォルダを開く
 */
function openCacheFolder() {
  window.API.sendOpenFolder(sysStore.staticResouces.paths.cache[prop.contentType])
}
</script>

<template>
  <div class="q-px-md">
    <h1 class="q-py-xs">{{ $t('additionalContents.management', { type: $t(`additionalContents.${prop.contentType}` )}) }}</h1>

    <span class="text-caption">{{ $t('additionalContents.installed', { type: $t(`additionalContents.${prop.contentType}` ) }) }}</span>
    <div class="row q-gutter-md q-pa-sm">
      <template v-if="mainStore.world.additional[`${contentType}s`].length > 0">
        <div v-for="item in mainStore.world.additional[`${contentType}s`]" :key="item.name" class="col-">
          <ItemCardView :content-type="contentType" is-delete :content="item" />
        </div>
      </template>
      <div v-else class="full-width">
        <p class="q-my-lg text-center text-h5" style="opacity: .6;">
          {{ $t('additionalContents.notInstalled', { type: $t(`additionalContents.${prop.contentType}` )}) }}
        </p>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <div class="row justify-between">
      <span class="text-caption">{{ $t('additionalContents.add', { type: $t(`additionalContents.${prop.contentType}` ) }) }}</span>
      <q-btn
        dense
        flat
        :label="`${$t(`additionalContents.${prop.contentType}`)}の保存場所を開く`"
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
          :label="$t('additionalContents.newInstall')"
          min-height="4rem"
          @click="importNewContent"
          :card-style="{
            'border-radius': '6px',
            'border-color': getCssVar('primary')
          }"
          class="text-primary"
        />
      </div>
      <div v-for="item in getNewContents(mainStore.world.additional[`${prop.contentType}s`])" :key="item.name">
        <ItemCardView :content-type="contentType" :content="item" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.folderBtn {
  border-color: transparent;
}
</style>