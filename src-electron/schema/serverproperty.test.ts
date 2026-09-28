import { describe, expect, test } from 'vitest';
import {
  DefaultServerPropertiesAnnotation,
  isValidNumberProperty,
  ServerProperties,
} from './serverproperty';

/** プロパティ画面の入力チェックで値が許容されるか */
function isAcceptedInEditor(key: string, value: number) {
  const annotation = DefaultServerPropertiesAnnotation[key];
  return (
    annotation?.type === 'number' && isValidNumberProperty(value, annotation)
  );
}

/**
 * Minecraft Wiki（https://minecraft.wiki/w/Server.properties）で許容されている境界値
 */
const wikiAllowedValues: [key: string, value: number][] = [
  ['max-tick-time', -1],
  ['max-tick-time', 0],
  ['entity-broadcast-range-percentage', 10],
  ['entity-broadcast-range-percentage', 1000],
  ['op-permission-level', 0],
  ['op-permission-level', 4],
  ['function-permission-level', 1],
  ['function-permission-level', 4],
  ['max-players', 0],
  ['max-players', 2 ** 31 - 1],
  ['max-world-size', 1],
  ['max-world-size', 29999984],
  ['network-compression-threshold', -1],
  ['server-port', 1],
  ['server-port', 2 ** 16 - 2],
  ['simulation-distance', 3],
  ['simulation-distance', 32],
  ['view-distance', 3],
  ['view-distance', 32],
  ['chat-spam-threshold-seconds', 0],
  ['command-spam-threshold-seconds', 0],
  ['management-server-port', 0],
  ['management-server-port', 2 ** 16 - 1],
  ['pause-when-empty-seconds', 0],
  ['status-heartbeat-interval', 0],
  ['text-filtering-version', 0],
  ['text-filtering-version', 1],
];

describe('サーバープロパティの許容値', () => {
  test.each(wikiAllowedValues)(
    '%s=%d をserver.propertiesから読み込んでも既定値に戻らない',
    (key, value) => {
      // server.properties の値は文字列として読み込まれる
      const props = ServerProperties.parse({ [key]: value.toString() });
      expect(props[key]).toBe(value);
    }
  );

  test.each(wikiAllowedValues)(
    '%s=%d をプロパティ画面で入力できる',
    (key, value) => {
      expect(isAcceptedInEditor(key, value)).toBe(true);
    }
  );

  test('範囲外の値は既定値に戻され，プロパティ画面でも入力できない', () => {
    const props = ServerProperties.parse({
      'max-tick-time': '-2',
      'op-permission-level': '5',
    });
    expect(props['max-tick-time']).toBe(60000);
    expect(props['op-permission-level']).toBe(4);
    expect(isAcceptedInEditor('max-tick-time', -2)).toBe(false);
    expect(isAcceptedInEditor('op-permission-level', 5)).toBe(false);
  });

  test.each<[key: string, value: number, def: number]>([
    ['chat-spam-threshold-seconds', -1, 10],
    ['text-filtering-version', 2, 0],
    ['management-server-port', 2 ** 16, 0],
  ])(
    '範囲外の %s=%d は既定値(%d)に戻され，プロパティ画面でも入力できない',
    (key, value, def) => {
      const props = ServerProperties.parse({ [key]: value.toString() });
      expect(props[key]).toBe(def);
      expect(isAcceptedInEditor(key, value)).toBe(false);
    }
  );

  test('プロパティ画面で入力できる最大値はJavaのlong型に収まり，正確に保存できる', () => {
    const annotation = DefaultServerPropertiesAnnotation['max-tick-time'];
    if (annotation?.type !== 'number' || annotation.max === undefined) {
      throw new Error('max-tick-time must be a number property with max');
    }

    // 保存時の文字列がJavaのlong型の最大値を超えない
    expect(BigInt(annotation.max.toString())).toBeLessThanOrEqual(
      2n ** 63n - 1n
    );
    // 数値として正確に往復できる
    expect(Number.isSafeInteger(annotation.max)).toBe(true);
  });
});

describe('サーバープロパティの型', () => {
  const boolKeys = [
    'enable-code-of-conduct',
    'management-server-enabled',
    'management-server-tls-enabled',
  ];
  // 既定値に関わらず読み込めることを確かめるため，true / false の両方で検証する
  const boolCases = boolKeys.flatMap((key) =>
    [true, false].map((value) => [key, value] as const)
  );

  test.each(boolCases)(
    '%s=%s はserver.propertiesから真偽値として読み込まれる',
    (key, value) => {
      const props = ServerProperties.parse({ [key]: value.toString() });
      expect(props[key]).toBe(value);
    }
  );

  test.each(boolKeys)('%s はプロパティ画面でトグルとして編集できる', (key) => {
    expect(DefaultServerPropertiesAnnotation[key]?.type).toBe('boolean');
  });
});
