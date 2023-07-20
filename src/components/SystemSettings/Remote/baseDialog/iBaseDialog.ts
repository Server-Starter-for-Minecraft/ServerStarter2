export interface baseDialogProp {
  disable?: boolean
  overline?: string
  title: string
  okBtnTxt: string
  color?: string
  onOkClick: () => void
  onClose: () => void
}

interface updatePatDialogProp {
  oldPat: string
}

interface unlinkDialogProp {
  owner: string
  repo: string
}

export type updatePatProp = baseDialogProp & updatePatDialogProp
export type unlinkRepoProp = baseDialogProp & unlinkDialogProp

export interface updatePatDialogReturns {
  newPat: string
}