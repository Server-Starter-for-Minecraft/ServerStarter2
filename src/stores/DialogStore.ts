import { defineStore } from 'pinia'

type DialogBtn = {label: string, color?: string, action?: () => void}

export const useDialogStore = defineStore('dialogStore', {
  state: () => {
    return {
      dialogModel: false,
      dialogTitleKey: 'error.title',
      dialogMessageKey: '',
      dialogMessageArg: {} as Record<string, unknown> | undefined,
      dialogBtns: [] as DialogBtn[] | undefined
    }
  },
  actions: {
    showDialog(titleI18nKey: string, messageI18nKey: string, messageI18nArg?: Record<string, unknown>, options?: DialogBtn[]) {
      this.dialogModel = true
      this.dialogTitleKey = titleI18nKey
      this.dialogMessageKey = messageI18nKey
      this.dialogMessageArg = messageI18nArg
      this.dialogBtns = options ?? [{label: 'OK', color: 'primary'}]
    }
  }
})