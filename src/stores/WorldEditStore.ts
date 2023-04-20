import { World } from 'app/src-electron/api/scheme';
import { defineStore } from 'pinia';

export const useWorldEditStore = defineStore('worldEditStore', {
  state: () => {
    return {
      worldIndex: -1,
      world: {} as World
    }
  },
})