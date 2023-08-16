<script setup lang="ts">
import ConsoleList from './components/ConsoleList.vue';
import ConsoleWindow from './components/ConsoleWindow.vue';
import { useConsoleStore, callbacks } from './stores/console';

const store = useConsoleStore();

for (const key of Object.keys(window.API)) {
  if (!key.startsWith('on')) continue;
  // on...形式のAPIにリスナーを登録
  window.API[key](async (_: any, ...args: any[]) => {
    const result =
      key + '(' + args.map((x) => JSON.stringify(x)).join(',') + ')';
    store.pushConsoleTo('on', result);
  });
}

for (const key of Object.keys(window.API)) {
  if (!key.startsWith('handle')) continue;
  // on...形式のAPIにリスナーを登録
  window.API[key](async (_: any, ...args: any[]) => {
    const result =
      key + '(' + args.map((x) => JSON.stringify(x)).join(',') + ')';
    const value = await new Promise((resolve) => {
      const channel = store.addConsole({
        type: 'handle',
        values: [],
      });

      store.pushConsoleTo(channel, result);

      callbacks[channel] = (arg: any) => {
        resolve(arg);
        store.removeConsole(channel);
      };
    });
    console.log(value);
    return value;
  });
}
</script>
<template>
  <div class="row fullscreen">
    <ConsoleList />
    <ConsoleWindow class="col" />
  </div>
</template>
