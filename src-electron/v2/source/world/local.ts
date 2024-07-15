import { z } from 'zod';
import { OpLevel } from '../../schema/player';
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
import { toRecord } from '../../util/obj/obj';
import { AsyncCache } from '../../util/promise/cache';
import { JsonSourceHandler } from '../../util/wrapper/jsonFile';
import { WorldContainerHandler } from './container';
import { parse, stringify } from './properties';

const SETTING_FILE_NAME = 'server_settings.json';
const PROPERTY_FILE_NAME = 'server.properties';

// types
const BANNEDIPS_FILE_NAME = 'banned-ips.json';
const BannedIps = z.array(BannedIp);
type BannedIps = z.infer<typeof BannedIps>;

const BANNEDPLAYERS_FILE_NAME = 'banned-players.json';
const BannedPlayers = z.array(BannedPlayer);
type BannedPlayers = z.infer<typeof BannedPlayers>;

const WHITELIST_FILE_NAME = 'whitelist.json';
const WhitelistPlayers = z.array(WhitelistPlayer);
type WhitelistPlayers = z.infer<typeof WhitelistPlayers>;

const OPS_FILE_NAME = 'ops.json';
const OpPlayers = z.array(OpPlayer);
type OpPlayers = z.infer<typeof OpPlayers>;

type OutputJsonHandlers = {
  bannedIps: JsonSourceHandler<BannedIps>;
  bannedPlayers: JsonSourceHandler<BannedPlayers>;
  whitelist: JsonSourceHandler<WhitelistPlayers>;
  ops: JsonSourceHandler<OpPlayers>;
};

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
        const outputPaths = this.outputFilePaths(worldName);
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

  private targetPath(worldName: WorldName): Path {
    return this.dirpath.child(worldName);
  }

  private settingFilePath(worldName: WorldName): Path {
    return this.targetPath(worldName).child(SETTING_FILE_NAME);
  }

  private outputFilePaths(worldName: WorldName) {
    const worldPath = this.targetPath(worldName);
    return {
      properties: worldPath.child(PROPERTY_FILE_NAME),
      bannedIps: worldPath.child(BANNEDIPS_FILE_NAME),
      bannedPlayers: worldPath.child(BANNEDPLAYERS_FILE_NAME),
      whitelist: worldPath.child(WHITELIST_FILE_NAME),
      ops: worldPath.child(OPS_FILE_NAME),
    };
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

    const handlers = this.jsonHandlers.get(name);
    const outputPaths = this.outputFilePaths(name);

    // データを展開
    const res = await Promise.all([
      handlers.bannedIps.write(world.bannedIps),
      handlers.bannedPlayers.write(world.bannedPlayers),
      handlers.ops.write(world.players.filter((p) => p.level !== 0)),
      handlers.whitelist.write(
        world.players.map(({ name, uuid }) => {
          return { name, uuid };
        })
      ),
      outputPaths.properties.writeText(stringify(world.properties)),
    ]);

    // エラーがあった場合は展開したファイルを削除
    const errRes = res.filter((v) => v.isErr);
    if (errRes.length > 0) {
      await Promise.all(Object.values(outputPaths).map((p) => p.remove()));
      // エラーは代表して1つ目を返す
      return errRes[0];
    }

    return ok(this.targetPath(name));
  }

  async packWorldData(name: WorldName): Promise<Result<void>> {
    const meta = await this.getWorldMeta(name);
    if (meta.isErr) return meta;
    const world = meta.value();

    const handlers = this.jsonHandlers.get(name);
    const outputPaths = this.outputFilePaths(name);

    // データを読取
    const res = await Promise.all([
      handlers.bannedIps.read(),
      handlers.bannedPlayers.read(),
      handlers.ops.read(),
      handlers.whitelist.read(),
      outputPaths.properties.readText(),
    ]);

    // エラーがあった場合は読取を中断
    const errRes = res.filter((v) => v.isErr);
    if (errRes.length > 0) {
      return errRes[0];
    }

    // オブジェクト内のデータを更新
    world.bannedIps = res[0].value();
    world.bannedPlayers = res[1].value();
    world.properties = parse(res[4].value());
    world.players = this.packPlayerData(res[3].value(), res[2].value());

    // 更新済みのオブジェクトを登録
    this.setWorldMeta(name, world);

    return ok();
  }

  private packPlayerData(whitelist: WhitelistPlayers, ops: OpPlayers) {
    // 全てのホワイトリストプレイヤーを'OpLevel=0'で登録する
    const playerObj = toRecord(
      whitelist.map((p): OpPlayer => {
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
    ops.forEach((p) => {
      playerObj[p.uuid] = p;
    });

    // OpLevel更新済みの全プレイヤーデータを格納する
    return Object.values(playerObj);
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('', () => {});
}
