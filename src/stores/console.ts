import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type ConsoleValue = string;

export const useCounterStore = defineStore('counter', () => {
  const consoles = ref<Record<string, ConsoleValue[]>>({});

  const getChannel = computed((channel: number) => consoles.value[channel]);

  return { consoles, getChannel };
});
