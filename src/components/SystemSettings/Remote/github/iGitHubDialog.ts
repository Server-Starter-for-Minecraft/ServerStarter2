interface updatePatDialogProp {
  oldPat: string;
}

interface unlinkDialogProp {
  title: string;
  owner: string;
  repo: string;
}

export type updatePatProp = updatePatDialogProp;
export type unlinkRepoProp = unlinkDialogProp;

export interface updatePatDialogReturns {
  newPat: string;
}
