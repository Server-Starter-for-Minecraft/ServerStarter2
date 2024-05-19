<script setup lang="ts">
import { ref } from 'vue';
import { callbacks, useConsoleStore } from 'src/dummy/stores/console';

const store = useConsoleStore();

async function sendApi() {
  const channel = store.getSelectedChannel;
  if (channel.type === 'handle') {
    const channel = store.selectedChannel;
    console.log(text.value);
    callbacks[channel](JSON.parse(text.value));
    delete callbacks[channel];
  }
}

const text = ref('');
</script>
<template>
  <div class="bg-grey-2 q-pa-sm">
    <div class="q-gutter-sm">
      <div class="row">
        <q-btn unelevated color="primary" @click="sendApi">
          戻り値を返却
        </q-btn>
      </div>
      <q-input v-model="text" filled autogrow />
    </div>
  </div>
</template>
