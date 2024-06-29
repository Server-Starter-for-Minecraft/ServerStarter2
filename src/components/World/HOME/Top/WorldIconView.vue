<script setup lang="ts">
import { useQuasar } from 'quasar';
import { assets } from 'src/assets/assets';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import IconSelectView from './IconSelecter/IconSelectView.vue';
import { IconSelectProp, IconSelectReturn } from './IconSelecter/iIconSelect';

const $q = useQuasar();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

/**
 * ワールドアイコンの選択（作成）画面を表示する
 */
function openIconSelecter() {
  $q.dialog({
    component: IconSelectView,
    componentProps: {
      img: mainStore.world?.avater_path,
    } as IconSelectProp,
  }).onOk((p: IconSelectReturn) => {
    if (mainStore.world?.avater_path) {
      mainStore.world.avater_path = p.img;
    }
  });
}
</script>

<template>
  <div class="column q-pt-md">
    <q-avatar square size="10rem">
      <q-img
        :src="mainStore.world?.avater_path ?? assets.png.unset"
        style="image-rendering: pixelated"
      />
      <q-btn
        dense
        flat
        :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
        @click="openIconSelecter"
        class="absolute-center fit"
      />
    </q-avatar>

    <SsBtn
      :label="$t('home.icon')"
      width="10rem"
      :disable="consoleStore.status(mainStore.selectedWorldID) !== 'Stop'"
      @click="openIconSelecter"
      class="q-mt-lg"
    />
  </div>
</template>
