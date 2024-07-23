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
import { Path } from '../../util/binary/path';
import { InfinitMap } from '../../util/helper/infinitMap';
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

    const worldMataHandlers = InfinitMap.primitiveKeyWeakValue(
      (worldName: WorldName) => {
        return JsonSourceHandler.fromPath(
          this.settingFilePath(worldName),
          World
        );
      }
    );

    const getWorldMeta = async (
      worldName: WorldName
    ): Promise<Result<World>> => {
      const getResult = await worldMataHandlers.get(worldName).read();
      // 読み込み失敗時にデフォルト値を使用
      return getResult.onErr(() => Result.fromZod(World.safeParse({})));
    };

    const setWorldMeta = async (
      worldName: WorldName,
      world: World
    ): Promise<Result<World>> => {
      const setResult = await worldMataHandlers.get(worldName).write(world);
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

    // データを展開 存在しない情報は何もせずに成功として扱う
    const res = await Promise.all([
      world.bannedIps ? handlers.bannedIps.write(world.bannedIps) : ok(),
      world.bannedPlayers
        ? handlers.bannedPlayers.write(world.bannedPlayers)
        : ok(),
      world.players
        ? handlers.ops.write(world.players.filter((p) => p.level !== 0))
        : ok(),
      world.players
        ? handlers.whitelist.write(
            world.players.map(({ name, uuid }) => ({ name, uuid }))
          )
        : ok(),
      world.properties
        ? outputPaths.properties.writeText(stringify(world.properties))
        : ok(),
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
    const [bannedIps, bannedPlayers, ops, whitelist, properties] =
      await Promise.all([
        handlers.bannedIps.read(),
        handlers.bannedPlayers.read(),
        handlers.ops.read(),
        handlers.whitelist.read(),
        outputPaths.properties.readText(),
      ]);

    // オブジェクト内のデータを更新
    world.bannedIps = bannedIps.valueOrDefault(undefined);
    world.bannedPlayers = bannedPlayers.valueOrDefault(undefined);
    world.properties = properties
      .onOk((x) => ok(parse(x)))
      .valueOrDefault(undefined);
    world.players = this.packPlayerData(whitelist, ops).valueOrDefault(
      undefined
    );

    // 更新済みのオブジェクトを登録
    return this.setWorldMeta(name, world);
  }

  private packPlayerData(
    whitelist: Result<WhitelistPlayers>,
    ops: Result<OpPlayers>
  ): Result<OpPlayer[]> {
    const playerObj: Record<PlayerUUID, OpPlayer> = {};

    // プレイヤー関連の設定ファイルが存在しない場合はエラーを返す
    if (whitelist.isErr && ops.isErr) {
      return err.error('NO_EXISTS_PLAYER_SETTINGS');
    }

    // 全てのホワイトリストプレイヤーを'OpLevel=0'で登録する
    if (whitelist.isOk) {
      whitelist.value().forEach((p) => {
        playerObj[p.uuid] = {
          name: p.name,
          uuid: p.uuid,
          level: OpLevel.parse(0),
          bypassesPlayerLimit: false,
        };
      });
    }

    // Opリストに登録済みのプレイヤーの情報を更新
    if (ops.isOk) {
      ops.value().forEach((p) => {
        playerObj[p.uuid] = p;
      });
    }

    // OpLevel更新済みの全プレイヤーデータを格納する
    return ok(Object.values(playerObj));
  }
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  const { IpAdress } = await import('../../schema/ipadress');
  const { PlayerName, PlayerUUID } = await import('../../schema/player');
  const { McTimestamp } = await import('../../schema/timestamp');

  // 一時使用フォルダを初期化
  const workPath = new Path(__dirname).child('work');
  await workPath.mkdir();

  type TestCase = {
    worldName: string;
    setting: World;
    files: {
      file: string;
      json?: any;
      txt?: string;
    }[];
  };

  const testCases: TestCase[] = [
    {
      worldName: 'bannedIp',
      setting: {
        using: false,
        version: { type: 'unknown' },
        bannedIps: [
          {
            ip: IpAdress.parse('IpAdress'),
            created: McTimestamp.parse('2024-01-01 23:47:21 +0900'),
            source: '??',
            expires: 'forever',
            reason: 'nantonaku',
          },
        ],
      },
      files: [
        {
          file: BANNEDIPS_FILE_NAME,
          json: [
            {
              ip: 'IpAdress',
              created: '2024-01-01 23:47:21 +0900',
              source: '??',
              expires: 'forever',
              reason: 'nantonaku',
            },
          ],
        },
      ],
    },
    {
      worldName: 'bannedPlayers',
      setting: {
        using: false,
        version: { type: 'unknown' },
        bannedPlayers: [
          {
            uuid: PlayerUUID.parse('1234-1234-123412341234-12341234-1234'),
            created: McTimestamp.parse('2024-01-01 23:47:21 +0900'),
            source: '??',
            expires: 'forever',
            reason: 'nantonaku',
          },
        ],
      },
      files: [
        {
          file: BANNEDPLAYERS_FILE_NAME,
          json: [
            {
              uuid: PlayerUUID.parse('1234-1234-123412341234-12341234-1234'),
              created: McTimestamp.parse('2024-01-01 23:47:21 +0900'),
              source: '??',
              expires: 'forever',
              reason: 'nantonaku',
            },
          ],
        },
      ],
    },
    {
      worldName: 'whitelist_op',
      setting: {
        using: false,
        version: { type: 'unknown' },
        players: [
          {
            name: PlayerName.parse(''),
            uuid: PlayerUUID.parse('0000-0000-000000000000-00000000-0000'),
            level: OpLevel.parse(0),
            bypassesPlayerLimit: false,
          },
          {
            name: PlayerName.parse('player1'),
            uuid: PlayerUUID.parse('1111-1111-111111111111-11111111-1111'),
            level: OpLevel.parse(1),
            bypassesPlayerLimit: false,
          },
          {
            name: PlayerName.parse('player2'),
            uuid: PlayerUUID.parse('2222-2222-2222-2222-2222'),
            level: OpLevel.parse(2),
            bypassesPlayerLimit: false,
          },
          {
            name: PlayerName.parse('player3'),
            uuid: PlayerUUID.parse('3333-3333-3333-3333-3333'),
            level: OpLevel.parse(0),
            bypassesPlayerLimit: false,
          },
        ],
      },
      files: [
        {
          file: WHITELIST_FILE_NAME,
          json: [
            {
              name: '',
              uuid: '0000-0000-000000000000-00000000-0000',
            },
            { name: 'player1', uuid: '1111-1111-111111111111-11111111-1111' },
            { name: 'player2', uuid: '2222-2222-2222-2222-2222' },
            { name: 'player3', uuid: '3333-3333-3333-3333-3333' },
          ],
        },
        {
          file: OPS_FILE_NAME,
          json: [
            {
              name: 'player1',
              uuid: '1111-1111-111111111111-11111111-1111',
              level: 1,
              bypassesPlayerLimit: false,
            },
            {
              uuid: '2222-2222-2222-2222-2222',
              name: 'player2',
              level: 2,
              bypassesPlayerLimit: false,
            },
          ],
        },
      ],
    },
    {
      worldName: 'properties',
      setting: {
        using: false,
        version: { type: 'unknown' },
        properties: { 'allow-flight': 'true', motd: 'A Minecraft Server' },
      },
      files: [
        {
          file: 'server.properties',
          txt: 'allow-flight=true\nmotd=A Minecraft Server',
        },
      ],
    },
  ];

  const source = new LocalWorldSource(workPath);
  test.each(testCases)(
    'packFiles ($worldName)',
    async ({ setting, files, worldName }) => {
      // テスト先をリセット
      const worldPath = workPath.child(worldName);
      await worldPath.emptyDir();

      // 設定ファイルを書き出し
      for (const file of files) {
        const path = worldPath.child(file.file);
        if (file.json) await path.writeText(JSON.stringify(file.json));
        if (file.txt) await path.writeText(file.txt);
      }

      // 設定ファイルを梱包
      expect(
        (await source.packWorldData(WorldName.parse(worldName))).isOk
      ).toBe(true);

      const settingContent = await worldPath
        .child(SETTING_FILE_NAME)
        .readText();

      // server_settings.jsonに期待する内容が含まれる
      expect(JSON.parse(settingContent.value())).toEqual(
        expect.objectContaining(setting)
      );
    }
  );

  test.each(testCases)(
    'extractFiles ($worldName)',
    async ({ setting, files, worldName }) => {
      // テスト先をリセット
      const worldPath = workPath.child(worldName);
      await worldPath.emptyDir();

      // server_settings.jsonを書き出し
      await worldPath
        .child(SETTING_FILE_NAME)
        .writeText(JSON.stringify(setting));

      // 設定ファイルを展開する
      expect(
        (await source.extractWorldData(WorldName.parse(worldName))).isOk
      ).toBe(true);

      // 展開したファイルの中身を確認する
      files.forEach(async (file) => {
        const extractedFileContent = await worldPath
          .child(file.file)
          .readText();
        if (file.json) {
          expect(JSON.parse(extractedFileContent.value())).toEqual(
            expect.objectContaining(file.json)
          );
        } else {
          expect(extractedFileContent.value()).toEqual(file.txt);
        }
      });
    }
  );
}
