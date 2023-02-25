import { defineStore } from 'pinia';

const progressStore = defineStore('progressStore', {
  state: () => {
    return {message: ''}
  }
})

export function setStatus(title:string) {
  progressStore().message = title
}