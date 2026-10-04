import { describe, expect, test } from 'vitest';
import { MinecraftColors } from 'app/src-electron/schema/static';
import { SCHEMA_VERSION_KEY } from 'app/src-electron/util/versioning/versionedSchema';
import { systemSettingsSchema } from './systemSchema';

const dye = MinecraftColors.parse({});

/** 指定した色のプレイヤーグループを持つ、バージョン1のシステム設定ファイルの内容 */
function settingsV1(colors: Record<string, string>) {
  const groups = Object.fromEntries(
    Object.entries(colors).map(([name, color]) => [
      name,
      { name, color, players: [] },
    ])
  );
  return { player: { groups }, [SCHEMA_VERSION_KEY]: 1 };
}

describe('システム設定ファイルの変換', () => {
  test('以前のプレイヤーグループの色は、表示していた染料・羊毛の色に変換される', () => {
    const settings = systemSettingsSchema.parse(
      settingsV1({ red: '#AA0000', brownIcon: '#5555FF', lower: '#55ffff' })
    );

    expect(settings.player.groups.red.color).toBe(dye.red);
    expect(settings.player.groups.brownIcon.color).toBe(dye.brown);
    expect(settings.player.groups.lower.color).toBe(dye.light_blue);
  });

  test('以前の16色に含まれない色は、以前の表示と同じく白に変換される', () => {
    const settings = systemSettingsSchema.parse(
      settingsV1({ custom: '#123456' })
    );

    expect(settings.player.groups.custom.color).toBe(dye.white);
  });

  test('バージョン管理を導入する前の設定ファイルも、グループの色が変換される', () => {
    const { [SCHEMA_VERSION_KEY]: _, ...legacy } = settingsV1({
      g: '#FFAA00',
    });
    const settings = systemSettingsSchema.parse(legacy);

    expect(settings.player.groups.g.color).toBe(dye.orange);
  });

  test('変換後の設定ファイルを保存して読み込んでも、色は変わらない', () => {
    const settings = systemSettingsSchema.parse(settingsV1({ g: '#FFAA00' }));
    const saved = JSON.parse(
      JSON.stringify(systemSettingsSchema.serialize(settings))
    );

    expect(systemSettingsSchema.parse(saved).player.groups.g.color).toBe(
      dye.orange
    );
  });
});
