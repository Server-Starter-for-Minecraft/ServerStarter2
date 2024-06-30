<script setup lang="ts">
import { tError } from 'src/i18n/utils/tFunc';
import { useMainStore } from 'src/stores/MainStore';
import { checkError } from 'src/components/Error/Error';
import SsBtn from 'src/components/util/base/ssBtn.vue';

const mainStore = useMainStore();

async function openFolder() {
  const path = await window.API.invokeGetWorldPaths(
    mainStore.selectedWorldID,
    'world'
  );

  checkError(
    path,
    async (p) => {
      const res = await window.API.sendOpenFolder(p, true);
      checkError(res, undefined, (e) => tError(e));
    },
    (e) => tError(e)
  );
}
</script>

<template>
  <div class="q-pl-md">
    <div class="text-caption" style="opacity: 0.6">
      {{ $t('others.openFolder.desc') }}
    </div>
    <SsBtn
      :label="$t('others.openFolder.btnText')"
      @click="openFolder"
      class="q-mt-md"
    />
  </div>
</template>
