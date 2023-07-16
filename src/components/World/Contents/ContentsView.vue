<script setup lang="ts" generic="T extends Record<string, any>">
import { AllFileData, CacheFileData } from 'app/src-electron/schema/filedata';
import { useMainStore } from 'src/stores/MainStore';
import ItemCardView from './itemCardView.vue';
import { checkError } from 'src/components/Error/Error';

interface Prop {
  type: 'datapack' | 'plugin' | 'mod'
  candidateItems: CacheFileData<T>[]
}
const prop = defineProps<Prop>()

const mainStore = useMainStore()


function addContent2World(content: AllFileData<T>) {
  // TODO: cacheFileDataへの登録もフロントで行うのか？
  (mainStore.world.additional[`${prop.type}s`] as AllFileData<T>[]).push(content)
}

async function importNewContent() {
  // エラー回避のため、意図的にswitchで分岐して表現を分かりやすくしている
  switch (prop.type) {
    case 'datapack':
      // TODO: 導入するデータパックについて、isFile = false|true を選択できるUIの提供
      // TODO: 翻訳時にtypeのアルファベットは全て日本語（or 適切な表現）に変換する
      // TODO: 何もファイルを選択せずに修了した場合もエラー扱いとなるため、翻訳時にそのことを含意する文言に修正
      checkError(
        await window.API.invokePickDialog({type: 'datapack', isFile: true}),
        c => addContent2World(c),
        `${prop.type}の導入は行われませんでした`
      )
      break;
    case 'plugin':
      checkError(
        await window.API.invokePickDialog({type: 'plugin'}),
        c => addContent2World(c),
        `${prop.type}の導入は行われませんでした`
      )
      break;
    case 'mod':
      checkError(
        await window.API.invokePickDialog({type: 'mod'}),
        c => addContent2World(c),
        `${prop.type}の導入は行われませんでした`
      )
    default:
      break;
  }
}
</script>

<template>
  <div class="q-px-md">
    <h1 class="q-py-xs">{{$t('additionalContents.management',{ type: prop.type })}}</h1>
  
    <span class="text-caption">{{$t('additionalContents.installed',{ type: prop.type })}}</span>
    <div class="row q-gutter-md q-pa-sm">
      <div v-for="item in mainStore.world.additional[`${type}s`]" :key="item.name" class="col-">
        <ItemCardView v-if="'description' in item" :name="item.name" :desc="item.description" action-type="delete" />
        <ItemCardView v-else :name="item.name" action-type="delete" />
      </div>
    </div>

    <q-separator class="q-my-md" />
    
    <span class="text-caption">{{$t('additionalContents.add',{ type: prop.type })}}</span>
    <div class="row q-gutter-sm q-pa-sm col-">
      <ItemCardView :name="$t('additionalContents.newInstall')" color="#2E5F19" @click="importNewContent"/>
      <!-- TODO: 導入済みのコンテンツは表示しない -->
      <!-- TODO: 上記と同じようにcandidateItemsを引数として受けずにSysStoreから直接取得？ -->
      <template v-for="item in candidateItems" :key="item.id">
        <ItemCardView :name="item.name" :desc="item.description" action-type="add" />
      </template>
    </div>
  </div>
</template>