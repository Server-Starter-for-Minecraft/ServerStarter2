import { defineStore } from 'pinia'

export const useDialogStore = defineStore('dialogStore', {
  state: () => {
    return {
      dialogModel: false,
      dialogMessage: ''
    }
  },
  actions: {
    showDialog(message: string) {
      this.dialogModel = true
      this.dialogMessage = message
    }
  }
})