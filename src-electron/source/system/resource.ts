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
    expect(staticResources.minecraftColors.light_blue).toBe('#3AB3DA');

    // paths
    expect(staticResources.paths.log.endsWith('log')).toBe(true);
  });
}
