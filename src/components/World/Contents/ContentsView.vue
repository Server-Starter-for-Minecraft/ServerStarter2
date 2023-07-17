<script setup lang="ts">
import { getCssVar } from 'quasar';
import { AllFileData, CacheFileData, DatapackData, ModData, PluginData } from 'app/src-electron/schema/filedata';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { checkError } from 'src/components/Error/Error';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import ItemCardView from './itemCardView.vue';
import { getCacheContents } from 'src/init';

type T = DatapackData | PluginData | ModData

interface Prop {
  contentType: 'datapack' | 'plugin' | 'mod'
  candidateItems: CacheFileData<T>[]
}
const prop = defineProps<Prop>()

const sysStore = useSystemStore()
const mainStore = useMainStore()

/**
 * キャッシュされたコンテンツのうち、導入済みのコンテンツを除外した一覧
 */
function getNewContents(worldContents: AllFileData<T>[]) {
  return (sysStore.cacheContents[`${prop.contentType}s`] as CacheFileData<DatapackData | PluginData | ModData>[]).filter(
    c => worldContents.map(wc => wc.name).includes(c.name)
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
        `${prop.contentType}の導入は行われませんでした`
      )
      break;
    case 'plugin':
      checkError(
        await window.API.invokePickDialog({type: 'plugin'}),
        c => addContent2World(c),
        `${prop.contentType}の導入は行われませんでした`
      )
      break;
    case 'mod':
      checkError(
        await window.API.invokePickDialog({type: 'mod'}),
        c => addContent2World(c),
        `${prop.contentType}の導入は行われませんでした`
      )
    default:
      break;
  }
}

/**
 * コンテンツを各種データベースに登録
 */
function addContent2World(content: AllFileData<T>) {
  (mainStore.world.additional[`${prop.contentType}s`] as AllFileData<T>[]).push(content);
  getCacheContents()
}
</script>

<template>
  <div class="q-px-md">
    <h1 class="q-py-xs">{{ $t('additionalContents.management', { type: prop.contentType }) }}</h1>

    <span class="text-caption">{{ $t('additionalContents.installed', { type: prop.contentType }) }}</span>
    <div class="row q-gutter-md q-pa-sm">
      <template v-if="mainStore.world.additional[`${contentType}s`].length > 0">
        <div v-for="item in mainStore.world.additional[`${contentType}s`]" :key="item.name" class="col-">
          <ItemCardView :content-type="contentType" is-delete :content="item" />
        </div>
      </template>
      <div v-else class="full-width">
        <p class="q-my-lg text-center text-h5" style="opacity: .6;">
          {{ `導入された${contentType}はありません` }}
        </p>
      </div>
    </div>

    <q-separator class="q-my-md" />

    <span class="text-caption">{{ $t('additionalContents.add', { type: prop.contentType }) }}</span>
    <div class="row q-gutter-sm q-pa-sm col-">
      <AddContentsCard
        label="新規導入"
        min-height="4rem"
        @click="importNewContent"
        :card-style="{
          'border-radius': '6px',
          'border-color': getCssVar('primary')
        }"
        class="text-primary"
      />
      <template v-for="item in getNewContents(mainStore.world.additional[`${prop.contentType}s`])" :key="item.name">
        <ItemCardView :content-type="contentType" :content="item" />
      </template>
    </div>
  </div>
</template>