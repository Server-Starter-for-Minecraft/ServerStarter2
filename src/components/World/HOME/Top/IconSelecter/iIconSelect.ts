import { ImageURI } from 'app/src-electron/schema/brands';

/**
 * v-modelでやり取りする画像サイズオブジェクト
 */
export type IconImage = {
  data: ImageURI;
  width?: number;
  height?: number;
  /** 切り抜き画像を生成中の場合はtrue (生成中のdataは古いため登録させない) */
  processing?: boolean;
};

export interface IconSelectProp {
  img: ImageURI;
}

export interface IconSelectReturn {
  img: ImageURI;
}
