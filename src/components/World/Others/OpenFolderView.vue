<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';

const mainStore = useMainStore();

function openFolder() {
  window.API.invokeGetWorldPaths(mainStore.world.id, 'world');
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
