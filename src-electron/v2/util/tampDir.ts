import { Path } from './binary/path';
import { randomString } from './random/ramdomString';

/** 一次的なパスをつくるよ! */
export class TempDir extends Path {
  /**
   * tmpファイル/フォルダを確保する
   * @param ext 拡張子 e.g. ".png"
   * @returns
   */
  tmpChild(ext = '') {
    const getChild = () => {
      const childName = randomString({
        digit: 16,
      });
      return this.child(childName + ext);
    };

    // 再生成のトライ回数
    const maxTry = 100;

    for (let i = 0; i < maxTry; i++) {
      const child = getChild();
      if (child.exists()) return child;
    }
    throw new Error('MAX_RETRY_CREATE_TEMPPATH');
  }
}
