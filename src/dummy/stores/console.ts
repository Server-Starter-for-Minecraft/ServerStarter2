import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

export type ConsoleValue = string;

export type InvokeConsole = {
  type: 'invoke';
  values: ConsoleValue[];
};

export type HandleConsole = {
  type: 'handle';
  values: ConsoleValue[];
};

export type OnConsole = {
  type: 'on';
  values: ConsoleValue[];
};

export type Console = InvokeConsole | HandleConsole | OnConsole;

export const callbacks: Record<string, (arg: any) => void> = {};

export const useConsoleStore = defineStore('console', () => {
  const consoles = ref<Record<string, Console>>({
    main: { type: 'invoke', values: [] },
    on: { type: 'on', values: [] },
  });

  const selectedChannel = ref('0');

  function getChannel(channel: string) {
    return consoles.value[channel];
  }
  const getSelectedChannel = computed(
    () => consoles.value[selectedChannel.value]
  );

  function pushConsoleTo(channel: string, console: ConsoleValue) {
    consoles.value[channel].values.push(console);
  }

  let headerChannel = 0;
  function addConsole(console: Console) {
    headerChannel += 1;
    selectedChannel.value = headerChannel.toString();
    consoles.value[headerChannel] = console;
    return selectedChannel.value;
  }

  function pushConsole(console: ConsoleValue) {
    getSelectedChannel.value.values.push(console);
  }

  function removeConsole(channel: string) {
    delete consoles.value[channel];
  }

  return {
    consoles,
    selectedChannel,
    getChannel,
    pushConsoleTo,
    addConsole: addConsole,
    removeConsole,
    pushConsole: pushConsole,
    getSelectedChannel,
  };
});
