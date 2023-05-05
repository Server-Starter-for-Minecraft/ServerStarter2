import { defineStore } from 'pinia'

type DialogBtn = {label: string, color?: string, action?: () => void}

export const useDialogStore = defineStore('dialogStore', {
  state: () => {
    return {
      dialogModel: false,
      dialogMessage: '',
      dialogBtns: [] as DialogBtn[] | undefined
    }
  },
  actions: {
    showDialog(message: string, options?: DialogBtn[]) {
      this.dialogModel = true
      this.dialogMessage = message
      this.dialogBtns = options ?? [{label: 'OK', color: 'primary'}]
    }
  }
})