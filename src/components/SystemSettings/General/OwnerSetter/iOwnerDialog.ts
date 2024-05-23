import { Player } from "app/src-electron/schema/player";

export interface OwnerDialogProp {
  ownerPlayer?: Player
  persistent?: boolean;
}

export interface ReturnOwnerDialog {
  ownerPlayer?: Player
}