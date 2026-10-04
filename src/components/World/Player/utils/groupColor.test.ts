import { assets } from 'app/src/assets/assets';
import { describe, expect, test } from 'vitest';
import { keys } from 'app/src-public/scripts/obj/obj';
import { MinecraftColors } from 'app/src-electron/schema/static';
import { getColorLabel } from './groupColor';

const palette = MinecraftColors.parse({});

describe('グループの配色', () => {
  test('配色の16色すべてに、同じ名前の染料・羊毛の画像がある', () => {
    for (const label of keys(palette)) {
      expect(assets.png[`${label}_dye`]).toBeDefined();
      expect(assets.png[`${label}_wool`]).toBeDefined();
    }
  });

  test('グループの色コードから、その色の染料・羊毛の画像の名前が分かる', () => {
    for (const label of keys(palette)) {
      expect(getColorLabel(palette, palette[label])).toBe(label);
      expect(getColorLabel(palette, palette[label].toLowerCase())).toBe(label);
    }
  });

  test('未定義の色コードは白として扱う', () => {
    expect(getColorLabel(palette, '#123456')).toBe('white');
  });
});
