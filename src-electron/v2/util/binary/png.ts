/**
 * TODO: Streamを使った処理に換装する
 */

import sharp from 'sharp';
import { ImageURI } from '../../schema/player';
import { Bytes } from './bytes';
import { toBase64 } from './converter/base64';

export class Png {
  data: sharp.Sharp;
  constructor(data: sharp.Sharp) {
    this.data = data;
  }

  /** 切り抜いた画像データを返す */
  async crop(region: {
    top: number;
    left: number;
    width: number;
    height: number;
  }) {
    return new Png(this.data.clone().extract(region));
  }

  async toBeyesData() {
    return new Bytes(await this.data.toBuffer());
  }
}

export async function encodeURI(img: Png): Promise<ImageURI> {
  // ArrayBufferからbase64に変換
  const base64uri = (await img.toBeyesData()).convert(toBase64());

  return ImageURI.parse(`data:image/png;base64,${base64uri}`);
}
