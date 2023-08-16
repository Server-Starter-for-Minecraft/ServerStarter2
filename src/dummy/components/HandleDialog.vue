<script setup lang="ts">
import { ref } from 'vue';

const dialog = ref(false);
const content = ref('');

for (const key of Object.keys(window.API)) {
  if (!key.startsWith('handle')) continue;
  // handle...形式のAPIにリスナーを登録
  window.API[key](async (...args: any[]) => {
    content.value =
      key + '(' + args.map((x) => JSON.stringify(x)).join(',') + ')';
    dialog.value = true;
  });
}
</script>

<template>
  <q-dialog v-model="dialog" position="top">
    <q-card style="width: 350px"> {{ content }} </q-card>
  </q-dialog>
</template>
