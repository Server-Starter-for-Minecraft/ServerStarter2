export interface baseDialogProp {
  loading?: boolean;
  disable?: boolean;
  overline?: string;
  title: string;
  okBtnTxt?: string;
  color?: string;
  onOkClick?: () => void;
  onClose?: () => void;
}
