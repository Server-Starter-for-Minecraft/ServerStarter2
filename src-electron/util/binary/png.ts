import sharp from 'sharp';
import { BytesData } from './bytesData';

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
    return await BytesData.fromBuffer(await this.data.toBuffer());
  }
}
