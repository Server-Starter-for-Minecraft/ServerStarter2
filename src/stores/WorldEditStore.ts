import { World } from 'app/src-electron/api/schema';
import { defineStore } from 'pinia';

export const useWorldEditStore = defineStore('worldEditStore', {
  state: () => {
    return {
      worldIndex: -1,
      world: {} as World,
    };
  },
});
