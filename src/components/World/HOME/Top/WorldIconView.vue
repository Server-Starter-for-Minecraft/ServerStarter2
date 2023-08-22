<script setup lang="ts">
import { useQuasar } from 'quasar';
import { assets } from 'src/assets/assets';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import IconSelectView from './IconSelecter/IconSelectView.vue';

const $q = useQuasar()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()

/**
 * ワールドアイコンの選択（作成）画面を表示する
 */
function openIconSelecter() {
  $q.dialog({
    component: IconSelectView,
  }).onOk(() => {
    mainStore.world.avater_path = mainStore.iconCandidate
  })
}
</script>

<template>
  <q-avatar square size="10rem" class="q-ml-lg">
    <q-img
      :src="mainStore.world.avater_path ?? assets.png.unset"
      style="image-rendering: pixelated;"
    />
    <q-btn
      dense
      flat
      size="4.4rem"
      icon=""
      :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
      @click="openIconSelecter"
      class="absolute-center"
    />
  </q-avatar>

  <SsBtn
    :label="$t('home.icon')"
    width="10rem"
    :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
    @click="openIconSelecter"
    class="q-mt-lg"
  />
</template>