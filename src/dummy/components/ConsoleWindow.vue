<script setup lang="ts">
import { Ref, ref } from 'vue';
import { QVirtualScroll } from 'quasar';
import { useConsoleStore } from 'src/dummy/stores/console';
import ToolBarHandle from './ToolBarHandle.vue';
import ToolBarInvoke from './ToolBarInvoke.vue';

const store = useConsoleStore();

const virtualListRef: Ref<null | QVirtualScroll> = ref(null);

store.$subscribe(() => {
  if (store.getSelectedChannel) {
    virtualListRef.value?.scrollTo(store.getSelectedChannel.values.length + 1);
  }
});
</script>
<template>
  <div
    v-if="store.getSelectedChannel && store.getSelectedChannel.values"
    class="full-width full-height column justify-between"
  >
    <q-virtual-scroll
      class="col full-width"
      ref="virtualListRef"
      :items="store.getSelectedChannel.values"
      separator
      v-slot="{ item, index }"
    >
      <q-item :key="index" dense>
        {{ item }}
      </q-item>
    </q-virtual-scroll>
    <ToolBarInvoke v-if="store.getSelectedChannel.type === 'invoke'" />
    <ToolBarHandle v-else-if="store.getSelectedChannel.type === 'handle'" />
  </div>
</template>
