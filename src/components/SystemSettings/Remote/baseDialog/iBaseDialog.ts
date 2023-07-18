export interface baseDialogProp {
  isOKClickable: boolean
  overline: string
  title: string
  okBtnTxt: string
  color?: string
  onOkClick: () => void
  onClose: () => void
}

interface updatePatDialogProp {
  oldPat: string
}

export type updatePatProp = baseDialogProp & updatePatDialogProp
export type unlinkRepoProp = baseDialogProp

export interface updatePatDialogReturns {
  newPat: string
}