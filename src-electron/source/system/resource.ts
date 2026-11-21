import {
  STATIC_RESOURCE_WITHOUT_PATHS,
  StaticResouce,
} from '../../schema/static';
import {
  DATAPACK_CACHE_PATH,
  logDir,
  MOD_CACHE_PATH,
  PLUGIN_CACHE_PATH,
} from '../const';

/** フロントエンドへ渡す定数（保存先は実行環境から決まるため，ここで設定する） */
const STATIC_RESOURCE: StaticResouce = {
  ...STATIC_RESOURCE_WITHOUT_PATHS,
  paths: {
    log: logDir.str(),
    cache: {
      datapack: DATAPACK_CACHE_PATH.str(),
      plugin: PLUGIN_CACHE_PATH.str(),
      mod: MOD_CACHE_PATH.str(),
    },
  },
};

/** フロントエンドから要求される定数を返す */
export async function getStaticResoure() {
  return STATIC_RESOURCE;
}

/** In Source Testing */
if (import.meta.vitest) {
  test('static_resource', async () => {
    const staticResources = await getStaticResoure();

    // colors
    expect(staticResources.minecraftColors.light_blue).toBe('#3AB3DA');

    // properties
    expect(staticResources.properties['white-list']).toMatchObject({
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
    expect(staticResources.properties['difficulty']).toMatchObject({
      default: 'easy',
      enum: ['peaceful', 'easy', 'normal', 'hard'],
      type: 'string',
    });

    // paths
    expect(staticResources.paths.log.endsWith('log')).toBe(true);
  });
}
