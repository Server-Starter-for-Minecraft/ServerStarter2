import { defineStore } from 'pinia'

type DialogBtn = {label: string, color?: string, action?: () => void}

export const useDialogStore = defineStore('dialogStore', {
  state: () => {
    return {
      dialogModel: false,
      dialogTitle: 'Alert',
      dialogMessage: [] as string[],
      dialogBtns: [] as DialogBtn[] | undefined
    }
  },
  actions: {
    showDialog(title: string, message: string[], options?: DialogBtn[]) {
      this.dialogModel = true
      this.dialogTitle = title
      this.dialogMessage = message
      this.dialogBtns = options ?? [{label: 'OK', color: 'primary'}]
    }
  }
})