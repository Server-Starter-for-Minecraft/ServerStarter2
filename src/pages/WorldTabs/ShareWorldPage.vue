<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import ExistRemoteView from 'src/components/World/ShareWorld/ExistRemoteView.vue';
import NewRemoteView from 'src/components/World/ShareWorld/NewRemoteView.vue';

const mainStore = useMainStore()

function openHP() {
  window.API.sendOpenBrowser('https://civiltt.github.io/ServerStarter/ShareWorld')
}
</script>

<template>
  <div class="mainField">
    <h1 class="q-pt-lg q-pb-md q-ma-none">ワールド共有設定（ShareWorld）</h1>
    
    <div class="q-pb-lg text-body2" style="opacity: .6;">
      ワールド共有機能（ShareWorld）は複数のプレイヤー間で、どのプレイヤーがサーバーを起動しても常に最新のワールドを遊べるようにするための機能です。<br>
      使い方の詳細は<a href="javascript:void(0)" @click="openHP" class="text-primary">公式HP</a>をご参照ください。
    </div>

    <NewRemoteView v-if="mainStore.world.remote === void 0" />
    <ExistRemoteView v-else />
  </div>
</template>