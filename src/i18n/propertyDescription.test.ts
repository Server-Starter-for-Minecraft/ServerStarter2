import { describe, expect, test } from 'vitest';
import { DefaultServerPropertiesAnnotation } from 'app/src-electron/schema/serverproperty';
import { enUSproperty } from './en-US/Pages/World/property';
import { jaProperty } from './ja/Pages/World/property';

/**
 * 標準登録のサーバープロパティは，プロパティ画面で説明文が表示されるように
 * 対応する説明文が各言語に用意されていることを確認する
 */
describe('サーバープロパティの説明文', () => {
  const registeredKeys = Object.keys(DefaultServerPropertiesAnnotation);

  test.each(registeredKeys)('%s に日本語と英語の説明文がある', (key) => {
    // 'query.port' のようにドットを含むキーをパスとして解釈させないよう配列で指定する
    const nonEmpty = expect.stringMatching(/\S/);
    expect(jaProperty.description).toHaveProperty([key], nonEmpty);
    expect(enUSproperty.description).toHaveProperty([key], nonEmpty);
  });
});
