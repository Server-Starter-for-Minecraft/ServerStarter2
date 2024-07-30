/**
 * TODO: Streamを使った処理に換装する
 */
import sharp from 'sharp';
import * as stream from 'stream';
// import { ImageURI } from '../../schema/player';
import { Result } from '../base';
import { Bytes } from './bytes';
import { Readable, ReadableStreamer } from './stream';
import { Url } from './url';

// export class Png {
//   data: sharp.Sharp;
//   constructor(data: sharp.Sharp) {
//     this.data = data;
//   }

//   /** 切り抜いた画像データを返す */
//   async crop(region: {
//     top: number;
//     left: number;
//     width: number;
//     height: number;
//   }) {
//     return new Png(this.data.clone().extract(region));
//   }

//   async toBeyesData() {
//     return new Bytes(await this.data.toBuffer());
//   }
// }

// export async function encodeURI(img: Png): Promise<ImageURI> {
//   // ArrayBufferからbase64に変換
//   // TODO: 下記のコードを改善してテストが走り続けるようにする
//   const base64uri = (await img.toBeyesData()).convert(toBase64());

//   return ImageURI.parse(`data:image/png;base64,${base64uri}`);
// }

export class Png extends ReadableStreamer {
  static async write(readable: stream.Readable): Promise<Result<Png>> {
    const bytes = await Bytes.write(readable);
    return bytes.onOk((x) =>
      Result.catchSync(() => new Png(sharp(x.data).png()))
    );
  }

  readonly img: sharp.Sharp;

  constructor(img: sharp.Sharp) {
    super();
    this.img = img;
  }

  createReadStream(): Readable {
    return new Readable(this.img);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { Path } = await import('src-electron/v2/util/binary/path');

  // 一時使用フォルダを初期化
  const workPath = new Path(__dirname).child('work');
  workPath.mkdir();

  const testImgUrl =
    'https://server-starter-for-minecraft.github.io/assets/servers/vanilla.png';

  test('png import', async () => {
    const img = await new Url(testImgUrl).into(Png);
    expect(img.isOk).toBe(true);

    const res = await img.value().into(workPath.child('test.png'));
    expect(res.isOk).toBe(true);
  });
}
