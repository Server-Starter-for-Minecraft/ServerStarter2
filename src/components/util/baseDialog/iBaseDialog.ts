export interface baseDialogProp {
  disable?: boolean
  overline?: string
  title: string
  okBtnTxt: string
  color?: string
  onOkClick: () => void
  onClose: () => void
}