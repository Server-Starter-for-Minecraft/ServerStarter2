<script setup lang="ts">
import { getRemotesKey, useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import DangerView from 'src/components/util/danger/dangerView.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const remoteURL = `https://github.com/${mainStore.world.remote?.folder.owner}/${mainStore.world.remote?.folder.repo}/tree/${mainStore.world.remote?.name}`

function openURL(url: string) {
  window.API.sendOpenBrowser(url)
}
</script>

<template>
  <h1 class="q-py-md">同期先リモートデータ</h1>

  <div class="q-py-md">
    <div class="caption">リモートプラットフォーム</div>
    <div class="dataText">{{ mainStore.world.remote?.folder.type }}</div>
  </div>
  <div class="q-py-md">
    <div class="caption">ユーザー</div>
    <div class="dataText">{{ mainStore.world.remote?.folder.owner }}</div>
  </div>
  <div class="q-py-md">
    <div class="caption">リポジトリ</div>
    <div class="dataText">{{ mainStore.world.remote?.folder.repo }}</div>
  </div>
  <div class="q-py-md">
    <div class="caption">ワールド名</div>
    <div class="dataText">{{ mainStore.world.remote?.name }}</div>
  </div>
  <div class="q-py-md">
    <div class="caption">URL</div>
    <a href="javascript:void(0)" @click="openURL(remoteURL)" class="text-body2 naturalText">
      {{ remoteURL }}
    </a>
  </div>

  <q-separator class="q-mt-lg" />

  <DangerView view-title="ワールドの同期を解除" view-desc="（UI.pdfに基づいた文章に対応する適切なキーを当てる）" open-dialog-btn-text="同期を解除"
    dialog-title="リモートとの同期を解除します"
    dialog-desc="リモートとの同期を解除すると、これ以降にこのサーバーで遊んだ内容で共有相手がサーバーを起動できなくなります。<br>共有を解除して本当によろしいですか？"
    @action="mainStore.world.remote = undefined" />

  <DangerView v-if="mainStore.world.remote !== void 0" view-title="リモートデータを削除する" view-desc="（UI.pdfに基づいた文章に対応する適切なキーを当てる）"
    open-dialog-btn-text="登録を解除" dialog-title="リモートデータを削除します"
    dialog-desc="このワールドはリモート上のデータが削除されるため、共有相手も同期が解除されます。<br>本当にこのワールドのリモート上のデータを削除しますか？"
    @action="delete sysStore.remoteSettings[getRemotesKey(mainStore.world.remote?.folder)]" />
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