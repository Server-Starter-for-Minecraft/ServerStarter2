<script setup lang="ts">
import { useConsoleStore } from 'src/stores/console';
import ToolBar from './ToolBar.vue';
import { QVirtualScroll } from 'quasar';
import { Ref, ref } from 'vue';
const store = useConsoleStore();

const virtualListRef: Ref<null | QVirtualScroll> = ref(null);

store.$subscribe(() => {
  virtualListRef.value?.scrollTo(store.getSelectedChannel.length + 1);
});
</script>
<template>
  <div class="full-width full-height column justify-between">
    <q-virtual-scroll
      class="col full-width"
      ref="virtualListRef"
      :items="store.getSelectedChannel"
      separator
      v-slot="{ item, index }"
    >
      <q-item :key="index" dense>
        {{ item }}
      </q-item>
    </q-virtual-scroll>
    <ToolBar />
  </div>
</template>
