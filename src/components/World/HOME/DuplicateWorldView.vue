<script setup lang="ts">
import { ref } from 'vue';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';

const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const loading = ref(false)

async function duplicateWorld() {
  // ボタンをローディング所帯にする
  loading.value = true

  // ワールドを複製
  await mainStore.createNewWorld(mainStore.world.id)

  // ボタンの状態をリセット
  loading.value = false
}
</script>

<template>
  <p class="text-caption" style="opacity: .6;">
    ワールドを複製し，サーバーバージョンやプロパティ，OPプレイヤーなどの各種設定を引き継ぎます<br>
    ただし，ShareWorldの設定は複製されないため，改めて設定を行う必要があります
  </p>
  <SsBtn
    label="このワールドを複製"
    :loading="loading"
    :disable="loading || consoleStore.status(mainStore.world.id) !== 'Stop'"
    @click="duplicateWorld"
  />
</template>