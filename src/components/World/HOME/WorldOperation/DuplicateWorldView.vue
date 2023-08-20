<script setup lang="ts">
import { ref } from 'vue';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import { $T } from 'src/i18n/utils/tFunc';

interface Prop {
  onScrollTop: () => void
}
const prop = defineProps<Prop>()

const mainStore = useMainStore()
const consoleStore = useConsoleStore()

const loading = ref(false)

async function duplicateWorld() {
  // ボタンをローディング状態にする
  loading.value = true

  // ワールドを複製
  await mainStore.createNewWorld(mainStore.world.id)

  // ボタンの状態をリセット
  loading.value = false
  prop.onScrollTop()
}
</script>

<template>
  <p 
    class="text-caption" 
    style="opacity: .6;"
    v-html="$T('home.duplicate.duplicateDesc')"
  >
  </p>
  <SsBtn
    :label="$T('home.duplicate.btn')"
    :loading="loading"
    :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
    @click="duplicateWorld"
  />
</template>