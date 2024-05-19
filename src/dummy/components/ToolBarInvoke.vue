<script setup lang="ts">
import { ref } from 'vue';
import { useConsoleStore } from 'src/dummy/stores/console';

const store = useConsoleStore();

const sendOrInvoke = Object.keys(window.API).filter(
  (k) => k.startsWith('invoke') || k.startsWith('send')
);

async function sendApi() {
  let args: any[];
  try {
    args = JSON.parse(`[${text.value}]`);
  } catch (e) {
    store.pushConsole('引数のパースに失敗しました');
    return;
  }
  store.pushConsole(
    `${api.value}(${args.map((value) => JSON.stringify(value)).join(',')})`
  );

  // window.API.sendOpenFolder()
  const apifunc = window.API[api.value];

  let result: any;
  try {
    if (api.value.startsWith('invoke')) {
      const channel = store.selectedChannel;
      result = await apifunc(...args);
      store.pushConsoleTo(channel, JSON.stringify(result));
    } else {
      apifunc(...args);
    }
  } catch (e) {
    store.pushConsole(`APIの呼び出し先でエラーが発生しました ${e}`);
    return;
  }
}

const api = ref('');
const text = ref('');
</script>
<template>
  <div class="bg-grey-2 q-pa-sm">
    <div class="q-gutter-sm">
      <div class="row">
        <q-select v-model="api" :options="sendOrInvoke" class="col q-mr-sm" />
        <q-space />
        <q-btn unelevated color="primary" @click="sendApi"> APIを実行 </q-btn>
      </div>
      <q-input v-model="text" filled autogrow />
    </div>
  </div>
</template>
