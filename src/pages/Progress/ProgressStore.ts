import { defineStore } from 'pinia';

const progressStore = defineStore('progressStore', {
  state: () => {
    return {
      message: '',
      progressRatio: -1
    }
  }
})

export function setStatus(title:string) {
  progressStore().message = title
}

export function setProgress(ratio:number) {
  progressStore().progressRatio = ratio
}

export function getStore() {
  return progressStore()
}