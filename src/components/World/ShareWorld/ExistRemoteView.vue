<script setup lang="ts">
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import DangerView from 'src/components/util/dangerView.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const remoteKey = `${mainStore.world.remote?.owner}/${mainStore.world.remote?.repo}`
const remoteURL = `https://civiltt.github.io/${mainStore.world.remote?.owner}/${mainStore.world.remote?.repo}/tree/${mainStore.world.remote?.branch}`

function openURL(url: string) {
  window.API.sendOpenBrowser(url)
}
</script>

<template>
  <h1 class="q-py-md">同期先リモートデータ</h1>

  <div class="q-py-md">
    <div class="caption">リモートプラットフォーム</div>
    <div class="dataText">{{ mainStore.world.remote?.type }}</div>
  </div>
  <div class="q-py-md">
    <div class="caption">ユーザー</div>
    <div class="dataText">{{ mainStore.world.remote?.owner }}</div>
  </div>
  <div class="q-py-md">
    <div class="caption">リポジトリ</div>
    <div class="dataText">{{ mainStore.world.remote?.repo }}</div>
  </div>
  <div class="q-py-md">
    <div class="caption">ワールド名</div>
    <div class="dataText">{{ mainStore.world.remote?.branch }}</div>
  </div>
  <div class="q-py-md">
    <div class="caption">URL</div>
    <a
      href="javascript:void(0)"
      @click="openURL(remoteURL)"
      class="text-body2 naturalText"
    >
      {{ remoteURL }}
    </a>
  </div>

  <q-separator class="q-mt-lg" />

  <DangerView
    title="ワールドの同期を解除"
    i18n-key="（UI.pdfに基づいた文章に対応する適切なキーを当てる）"
    btn-text="同期を解除"
    @action="mainStore.world.remote = undefined"
  />

  <DangerView
    title="リモートアカウントの登録を解除"
    i18n-key="（UI.pdfに基づいた文章に対応する適切なキーを当てる）"
    btn-text="登録を解除"
    @action="delete sysStore.remoteSettings().github[remoteKey]"
  />
</template>

<style scoped lang="scss">
.caption {
  font-size: .6rem;
  opacity: .6;
}

.dataText {
  font-size: 1.5rem;
}

.body--dark {
  .naturalText {
    color: white;
  }
}
.body--light {
  .naturalText {
    color: black;
  }
}
</style>