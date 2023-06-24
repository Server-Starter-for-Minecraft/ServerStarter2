import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type ConsoleValue = string;

export type Console = {
  values: ConsoleValue[];
};

export const useConsoleStore = defineStore('console', () => {
  const consoles = ref<Record<string, ConsoleValue[]>>({
    0: [],
  });

  const selectedChannel = ref('0');

  const getChannel = computed((channel: string) => consoles.value[channel]);
  const getSelectedChannel = computed(
    () => consoles.value[selectedChannel.value]
  );

  let headerChannel = 0;
  function addChannel() {
    headerChannel += 1;
    selectedChannel.value = headerChannel.toString();
    consoles.value[headerChannel] = [];
  }

  function addConsole(console: ConsoleValue) {
    getSelectedChannel.value.push(console);
  }

  return {
    consoles,
    selectedChannel,
    getChannel,
    addChannel,
    addConsole,
    getSelectedChannel,
  };
});
