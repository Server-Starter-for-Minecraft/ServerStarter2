import sharp from 'sharp';
import * as stream from 'stream';
import { ImageURI } from '../../schema/player';
import { err, ok, Result } from '../base';
import { Bytes } from './bytes';
import { Readable, ReadableStreamer } from './stream';
import { Url } from './url';

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

  /** 切り抜いた画像データを返す */
  async crop(region: {
    top: number;
    left: number;
    width: number;
    height: number;
  }) {
    return Result.catchSync(() => new Png(this.img.clone().extract(region)));
  }

  /** URI（data:image/png;base64, ***）を返す */
  async encodeURI(): Promise<Result<ImageURI>> {
    const tmp = await this.createReadStream().into(Bytes);
    if (tmp.isErr) return err.error('Png data can not converted Bytes');

    const b64 = tmp.value().toStr('base64');
    if (b64.isErr) return err.error('Png data can not converted Base64');

    return ok(ImageURI.parse(`data:image/png;base64,${b64.value()}`));
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
    'https://textures.minecraft.net/texture/cc34879aeb728f1bf5fe74c1438362f68a0fd6803b8c63d85986cdc69473aa7f';
  const testImgUri =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAACC0lEQVR4nO2aTYrDMAyFtQmzGhjodVLodk4gAtrlQnOUXiB3yrobDyljUDT+S5w2dqIHD9qSGOuzIruxASLqv1sT8nj/CRpqV68AWs2AXh+BVmtAr0WwnUEY4PL0aWeBAS7HmAb7SJWPAeDZsKadKgEMjmAthKUgqgEw/qW0fe5DcEIuDsCQMHIyeOs1mSNdTAYMHhA2cB48oTGPx2MVhOIyoE+Y3lwAJuVkQ7EARhZw6lyfA2Lv+GFJcDn21RUoTYhouAFAOqbQomjW9mQimjmlfe7NF154dgD0v0ObApDtSwinA0ACxh4AjLTtjB0d/tl1vbRPKffG3DTNzAn3pANA8XxyAGyEgr5er0/zgCfZ34sFgI7gPUUqGQCXBPDx9VkfAEQ0XdclQXAB4FlRJQAiigKYOuUDkJv+LgCuQvtSABipAxYAh2C/J47Y+wGgJ/i1AGQW2OAVQFNgBmBg9GMZ4MoG3jmrhUWrDgDo+a9QHQDI7JAEFAOwZE0xOSYJwLH6dAdtzM0A3DYHEOq07/qQc99DBEZ9Cv4JQKVSqVQqlUqlUqlUKpVq983V0AsRKF2kAEgzgMLv+471CBA7P5BwvOYVLgMAsX2DN4PYHwCJjZM3Q6gXQJdw1uDwAMb41tZxASDieQCgA4ICwJNlAIpMOC0AZGcMqgcAmdNYbH8/JjgagHGj/f9U/QI/dqKU9EiQrgAAAABJRU5ErkJggg==';

  test('png import', async () => {
    const img = await new Url(testImgUrl).into(Png);
    expect(img.isOk).toBe(true);

    // uriの取得
    const b64 = (await img.value().encodeURI()).value();
    expect(b64).toBe(testImgUri);

    // imgを吐き出して終了
    const res = await img.value().into(workPath.child('test.png'));
    expect(res.isOk).toBe(true);
  });
}
