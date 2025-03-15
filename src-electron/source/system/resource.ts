import { StaticResouce } from '../../schema/static';

/** フロントエンドから要求される定数を返す */
export async function getStaticResoure() {
  return StaticResouce.parse({});
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('static_resource', async () => {
    const staticResources = await getStaticResoure();
    
    // colors
    expect(staticResources.minecraftColors.aqua).toBe('#55FFFF');
    
    // properties
    expect(
      staticResources.properties['white-list']
    ).toMatchObject({
      default: false,
      type: 'boolean',
    });
    expect(
      staticResources.properties['function-permission-level']
    ).toMatchObject({
      default: 2,
      max: 4,
      min: 1,
      step: 1,
      type: 'number',
    });
    expect(
      staticResources.properties['difficulty']
    ).toMatchObject({
      default: 'easy',
      enum: ['peaceful', 'easy', 'normal', 'hard'],
      type: 'string',
    });

    // paths
    expect(staticResources.paths.log.endsWith('log')).toBe(true);
  });
}
