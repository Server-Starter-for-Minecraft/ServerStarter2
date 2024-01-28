import { ImageURI } from 'app/src-electron/schema/brands';

/**
 * v-modelでやり取りする画像サイズオブジェクト
 */
export type IconImage = { data: ImageURI; width?: number; height?: number };

export interface IconSelectProp {
  img: ImageURI;
}

export interface IconSelectReturn {
  img: ImageURI;
}
