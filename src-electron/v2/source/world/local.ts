import { z } from 'zod';
import { OpLevel, PlayerUUID } from '../../schema/player';
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
import { parse, stringify } from './properties';

const SETTING_FILE_NAME = 'server_settings.json';

const outputFilePaths = (worldPath: Path) => {
  return {
    properties: worldPath.child('server.properties'),
    bannedIps: worldPath.child('banned-ips.json'),
    bannedPlayers: worldPath.child('banned-players.json'),
    whitelist: worldPath.child('whitelist.json'),
    ops: worldPath.child('ops.json'),
  };
};

// types
const BannedIps = z.array(BannedIp);
type BannedIps = z.infer<typeof BannedIps>;

const BannedPlayers = z.array(BannedPlayer);
type BannedPlayers = z.infer<typeof BannedPlayers>;

const WhitelistPlayers = z.array(WhitelistPlayer);
type WhitelistPlayers = z.infer<typeof WhitelistPlayers>;

const OpPlayers = z.array(OpPlayer);
type OpPlayers = z.infer<typeof OpPlayers>;

type OutputJsonHandlers = {
  bannedIps: typeof JsonSourceHandler<BannedIps>;
  bannedPlayers: typeof JsonSourceHandler<BannedPlayers>;
  whitelist: typeof JsonSourceHandler<WhitelistPlayers>;
  ops: typeof JsonSourceHandler<OpPlayers>;
};

interface Test {
  bannedIps: JsonSourceHandler<
    {
      ip: string & z.BRAND<'IpAdress'>;
      created: string & z.BRAND<'McTimestamp'>;
      source: string;
      expires: (string & z.BRAND<'McTimestamp'>) | 'forever';
      reason: string;
    }[]
  >;
  bannedPlayers: JsonSourceHandler;
  whitelist: JsonSourceHandler;
  ops: JsonSourceHandler;
}

/**
 * ローカルのワールドを管理するクラス
 */
export class LocalWorldSource implements WorldContainerHandler {
  private dirpath: Path;
  private jsonHandlers: InfinitMap<WorldName, OutputJsonHandlers>;
  private worldMataMap: InfinitMap<WorldName, AsyncCache<World>>;

  constructor(dirpath: Path) {
    this.dirpath = dirpath;
    this.jsonHandlers = InfinitMap.primitiveKeyWeakValue(
      (worldName: WorldName) => {
        const outputPaths = outputFilePaths(dirpath.child(worldName));
        return {
          bannedIps: JsonSourceHandler.fromPath(
            outputPaths.bannedIps,
            BannedIps
          ),
          bannedPlayers: JsonSourceHandler.fromPath(
            outputPaths.bannedPlayers,
            BannedPlayers
          ),
          whitelist: JsonSourceHandler.fromPath(
            outputPaths.whitelist,
            WhitelistPlayers
          ),
          ops: JsonSourceHandler.fromPath(outputPaths.ops, OpPlayers),
        };
      }
    );

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

  async packWorldData(name: WorldName): Promise<Result<void>> {
    const meta = await this.getWorldMeta(name);
    if (meta.isErr) return meta;
    const world = meta.value();

    // データを読取
    const res = await Promise.all([
      this.jsonHandlers.bannedIps.read(),
      this.jsonHandlers.bannedPlayers.read(),
      this.jsonHandlers.ops.read(),
      this.jsonHandlers.whitelist.read(),
      this.outputPaths.properties.readText(),
    ]);

    // エラーがあった場合は読取を中断
    const errRes = res.filter((v) => v.isErr);
    if (errRes.length > 0) {
      return errRes[0];
    }

    world.bannedIps = res[0].value();
    world.bannedPlayers = res[1].value();
    world.properties = parse(res[4].value());

    // 全てのホワイトリストプレイヤーを'OpLevel.0'で登録する
    const playerObj = toRecord(
      res[3].value().map((p): OpPlayer => {
        return {
          name: p.name,
          uuid: p.uuid,
          level: 0 as OpLevel,
          bypassesPlayerLimit: false,
        };
      }),
      'uuid'
    );
    // Opリストに登録済みのプレイヤーの情報を更新
    res[2].value().forEach((p) => {
      playerObj[p.uuid] = p;
    });
    // OpLevel更新済みの前夫レイヤーデータを格納する
    world.players = Object.values(playerObj);

    return ok();
  }
}

function toRecord<
  T extends { [K in keyof T]: any }, // added constraint,
  K extends keyof T
>(array: T[], selector: K): Record<string, T> {
  return array.reduce(
    (acc, item) => ((acc[item[selector]] = item), acc),
    {} as Record<T[K], T>
  );
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('', () => {});
}
