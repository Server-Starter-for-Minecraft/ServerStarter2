<script setup lang="ts">
import { useQuasar } from 'quasar';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import CustomMapImporterView from './CustomMapImporter/CustomMapImporterView.vue';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';

const $q = useQuasar()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()

/**
 * 配布ワールドとローカルワールドの導入画面を表示する
 */
 function openCustomMapImporter() {
  $q.dialog({
    component: CustomMapImporterView,
  })
}
</script>

<template>
  <p class="text-caption" style="opacity: .6;">
    {{ $t('home.useWorld.description') }}
  </p>
  <SsBtn
    :label="$t('home.useWorld.selectWorld')"
    :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
    @click="openCustomMapImporter"
  />
</template>