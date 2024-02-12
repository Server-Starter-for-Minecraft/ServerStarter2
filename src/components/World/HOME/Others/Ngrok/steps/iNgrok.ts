import { ImageURI } from 'app/src-electron/schema/brands';

export interface NgrokDialogProp {
  token: string;
}

export interface NgrokDialogReturns {
  token: string;
  isAllUesNgrok: boolean;
}

export interface ImgDialogProp {
  img: ImageURI;
  imgWidth: number;
}
