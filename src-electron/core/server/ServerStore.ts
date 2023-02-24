import { defineStore } from 'pinia';
import { World } from './world/world';

interface worldData {
    world: World | null
}
export const worldStore = defineStore('worldStore', {
  state: (): worldData => {
    return {
        world: null
    }
  }
})