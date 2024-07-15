import { z } from 'zod';
import {
  BannedIp,
  BannedPlayer,
  OpPlayer,
  WhitelistPlayer,
  World,
  WorldLocation,
  WorldName,
} from '../../schema/world';
import { err, ok, Result } from '../../util/base';
import { Json } from '../../util/binary/json';
import { Path } from '../../util/binary/path';
import { InfinitMap } from '../../util/helper/infinitMap';
import { AsyncCache } from '../../util/promise/cache';
import { JsonSourceHandler } from '../../util/wrapper/jsonFile';
import { WorldContainerHandler } from './container';
import { stringify } from './properties';

const SETTING_FILE_NAME = 'server_settings.json';

/**
 * ローカルのワールドを管理するクラス
 */
export class LocalWorldSource implements WorldContainerHandler {
  private dirpath: Path;
  private jsonHandlers;
  private outputPaths;
  private worldMataMap: InfinitMap<WorldName, AsyncCache<World>>;

  constructor(dirpath: Path) {
    this.dirpath = dirpath;
    this.outputPaths = {
      properties: dirpath.child('server.properties'),
      bannedIps: dirpath.child('banned-ips.json'),
      bannedPlayers: dirpath.child('banned-players.json'),
      whitelist: dirpath.child('whitelist.json'),
      ops: dirpath.child('ops.json'),
    };
    this.jsonHandlers = {
      bannedIps: JsonSourceHandler.fromPath(
        this.outputPaths.bannedIps,
        z.array(BannedIp)
      ),
      bannedPlayers: JsonSourceHandler.fromPath(
        this.outputPaths.bannedPlayers,
        z.array(BannedPlayer)
      ),
      whitelist: JsonSourceHandler.fromPath(
        this.outputPaths.whitelist,
        z.array(WhitelistPlayer)
      ),
      ops: JsonSourceHandler.fromPath(this.outputPaths.ops, z.array(OpPlayer)),
    };

    const settingJson = new Json(World);

    const getWorldMeta = async (
      worldName: WorldName
    ): Promise<Result<World>> => {
      // TODO: 読み込み失敗時にデフォルト値を使用?
      const data = await this.settingFilePath(worldName).into(settingJson);
      return data;
    };

    const setWorldMeta = async (
      worldName: WorldName,
      world: World
    ): Promise<Result<World>> => {
      settingJson.data = ok(world);
      const setResult = await settingJson.into(this.settingFilePath(worldName));
      return setResult.onOk(() => ok(world));
    };

    this.worldMataMap = InfinitMap.primitiveKeyWeakValue(
      (worldName: WorldName) =>
        new AsyncCache<World>(
          () => getWorldMeta(worldName),
          (world) => setWorldMeta(worldName, world)
        )
    );
  }

  private settingFilePath(worldName: WorldName): Path {
    return this.dirpath.child(worldName).child(SETTING_FILE_NAME);
  }

  async listWorldLocations(): Promise<WorldLocation[]> {
    const paths = await this.dirpath.iter();
    const parsed = await Promise.all(
      paths.map(async (path) => {
        if (await path.isDirectory()) {
          return Result.fromZod(
            WorldLocation.safeParse({
              container: {
                containerType: 'local',
                path: this.dirpath.toStr(),
              },
              worldName: path.basename(),
            })
          );
        }
        return err.error('ENOTDIR');
      })
    );
    return parsed.filter((x) => x.isOk).map((x) => x.value());
  }

  setWorldMeta(name: WorldName, world: World): Promise<Result<void>> {
    return this.worldMataMap.get(name).set(world);
  }

  getWorldMeta(name: WorldName): Promise<Result<World>> {
    return this.worldMataMap.get(name).get();
  }

  async deleteWorldData(name: WorldName): Promise<Result<void>> {
    return ok(await this.dirpath.child(name).remove());
  }

  async extractWorldData(name: WorldName): Promise<Result<Path>> {
    const meta = await this.getWorldMeta(name);
    if (meta.isErr) return meta;
    const world = meta.value();

    // データを展開
    const res = await Promise.all([
      this.jsonHandlers.bannedIps.write(world.bannedIps),
      this.jsonHandlers.bannedPlayers.write(world.bannedPlayers),
      this.jsonHandlers.ops.write(world.players.filter((p) => p.level !== 0)),
      this.jsonHandlers.whitelist.write(
        world.players.map(({ name, uuid }) => {
          return { name, uuid };
        })
      ),
      this.outputPaths.properties.writeText(stringify(world.properties)),
    ]);

    // エラーがあった場合は展開したファイルを削除
    const errRes = res.filter((v) => v.isErr);
    if (errRes.length > 0) {
      await Promise.all(Object.values(this.outputPaths).map((p) => p.remove()));
      // エラーは代表して1つ目を返す
      return errRes[0];
    }

    // TODO: @txkodo ここの戻り値はこれでOK？
    return ok(this.dirpath);
  }

  packWorldData(name: WorldName): Promise<Result<void>> {
    throw new Error('Method not implemented.');
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('', () => {});
}
