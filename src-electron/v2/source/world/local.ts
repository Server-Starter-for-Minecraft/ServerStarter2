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
      const data = (
        await this.settingFilePath(worldName).into(settingJson)
      ).onErr(() => Result.fromZod(World.safeParse({}))); // 読み込み失敗時にデフォルト値を使用?
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
    world.players = Result.all(whitelist, ops)
      .onOk(([i, j]) => ok(this.packPlayerData(i, j)))
      .valueOrDefault(undefined);

    // 更新済みのオブジェクトを登録
    return this.setWorldMeta(name, world);
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
  const { Bytes } = await import('../../util/binary/bytes');
  const { SHA1 } = await import('../../util/binary/hash');

  const testCases = [
    {
      worldName: 'bannedIp',
      setting: {
        bannedIps: [
          {
            ip: 'IpAdress',
            created: '2024-01-01 23:47:21 +0900',
            source: '??',
            expires: 'forever',
            reason: 'nantonaku',
          },
        ],
      },
      files: [
        {
          file: 'banned-ips.json',
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
        bannedPlayers: [
          {
            uuid: '1234-1234-123412341234-12341234-1234',
            created: '2024-01-01 23:47:21 +0900',
            source: '??',
            expires: 'forever',
            reason: 'nantonaku',
          },
        ],
      },
      files: [
        {
          file: 'banned-players.json',
          json: [
            {
              uuid: '1234-1234-123412341234-12341234-1234',
              created: '2024-01-01 23:47:21 +0900',
              source: '??',
              expires: 'forever',
              reason: 'nantonaku',
            },
          ],
        },
      ],
    },
  ];

  const workPath = new Path('src-electron/v2/source/world/test/work');
  const source = new LocalWorldSource(workPath);
  test.only.each(testCases)(
    '展開と梱包が正常に動く $worldName',
    async ({ setting, files, worldName }) => {
      const worldPath = workPath.child(worldName);
      await worldPath.emptyDir();

      // 設定ファイルを書き出し
      for (const file of files) {
        const path = worldPath.child(file.file);
        if (file.json) path.writeText(JSON.stringify(file.json));
        // if (file.txt) path.writeText(file.txt);
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

      /// TODO: 設定ファイルを展開する
    }
  );
}

// const getFileHash = async (path: Path) => {
//   // ファイルの中身を取得
//   const fileData = await path.into(Bytes);
//   if (fileData.isErr) return err(new Error('FILE_IS_INVALID'));

//   // ファイルのHashを取得
//   return fileData.value().into(SHA1);
// };

// const assetsPath = new Path(
//   'src-electron/v2/source/world/test/assets/worlds'
// );

// const targetWorldName = '展開済' as WorldName;

// const files = [
//   {
//     file: PROPERTY_FILE_NAME,
//     content: 'allow-flight=true',
//   },
//   {
//     file: BANNEDIPS_FILE_NAME,
//     content: [
//       {
//         ip: 'IpAdress',
//         created: '2024-01-01 23:47:21 +0900',
//         source: '??',
//         expires: 'forever',
//         reason: 'nantonaku',
//       },
//     ],
//   },
//   {
//     file: BANNEDPLAYERS_FILE_NAME,
//     content: [
//       {
//         uuid: '1234-1234-123412341234-12341234-1234',
//         created: '2024-01-01 23:47:21 +0900',
//         source: '??',
//         expires: 'forever',
//         reason: 'nantonaku',
//       },
//     ],
//   },
//   {
//     file: OPS_FILE_NAME,
//     content: [
//       {
//         uuid: '0000-0000-000000000000-00000000-0000',
//         name: '',
//         level: 1,
//         bypassesPlayerLimit: false,
//       },
//       {
//         uuid: '2222-2222-2222-2222-2222',
//         name: 'player2',
//         level: 2,
//         bypassesPlayerLimit: false,
//       },
//     ],
//   },
//   {
//     file: WHITELIST_FILE_NAME,
//     content: [
//       { name: '', uuid: '0000-0000-000000000000-00000000-0000' },
//       { name: 'player1', uuid: '1111-1111-111111111111-11111111-1111' },
//       { name: 'player2', uuid: '2222-2222-2222-2222-2222' },
//     ],
//   },
//   {
//     file: SETTING_FILE_NAME,
//     content: {
//       using: false,
//       version: { type: 'vanilla', id: '1.20.6', release: true },
//       properties: { 'allow-flight': 'true' },
//       datapack: [],
//       plugin: [],
//       mod: [],
//       runtime: { memory: [2, 'GB'] },
//       players: [
//         {
//           uuid: '0000-0000-000000000000-00000000-0000',
//           name: '',
//           level: 1,
//           bypassesPlayerLimit: false,
//         },
//         {
//           name: 'player1',
//           uuid: '1111-1111-111111111111-11111111-1111',
//           level: 0,
//           bypassesPlayerLimit: false,
//         },
//         {
//           uuid: '2222-2222-2222-2222-2222',
//           name: 'player2',
//           level: 2,
//           bypassesPlayerLimit: false,
//         },
//       ],
//       bannedPlayers: [
//         {
//           uuid: '1234-1234-123412341234-12341234-1234',
//           created: '2024-01-01 23:47:21 +0900',
//           source: '??',
//           expires: 'forever',
//           reason: 'nantonaku',
//         },
//       ],
//       bannedIps: [
//         {
//           ip: 'IpAdress',
//           created: '2024-01-01 23:47:21 +0900',
//           source: '??',
//           expires: 'forever',
//           reason: 'nantonaku',
//         },
//       ],
//       last: {
//         time: 1718456216406,
//         user: 'e19851cc-9493-4875-8d67-493b8474564f',
//         version: { type: 'vanilla', id: '1.20.6', release: true },
//       },
//     },
//   },
// ];

// test.each([
//   { explain: '全部', files },
//   ...files.map((x) => ({
//     explain: `${x.file}なし`,
//     files: files.filter((i) => i != x),
//   })),
//   { explain: '無', files: [] },
// ])('packWorldSettingFiles $explain', async ({ files }) => {
//   const packWorldName = WorldName.parse('pack');
//   const packWorldPath = workPath.child(packWorldName);

//   await packWorldPath.emptyDir();

//   for (const { file, content } of files) {
//     await packWorldPath
//       .child(file)
//       .writeText(
//         typeof content === 'string' ? content : JSON.stringify(content),
//         'utf8'
//       );
//   }

//   // 各種データを梱包
//   const res = await source.packWorldData(packWorldName);
//   expect(res.isOk).toBe(true);

//   const workSetting = await packWorldPath
//     .child('server_settings.json')
//     .readText();

//   const assetSetting = await assetsPath
//     .child('展開済')
//     .child('server_settings.json')
//     .readText();

//   expect(workSetting.value()).toBe(assetSetting.value());
// });

// test('extractWorldSettingFiles', async () => {
//   // 展開するファイル群
//   const checkFileNames = [
//     PROPERTY_FILE_NAME,
//     BANNEDIPS_FILE_NAME,
//     BANNEDPLAYERS_FILE_NAME,
//     OPS_FILE_NAME,
//     WHITELIST_FILE_NAME,
//   ];

//   // 展開前データのHashを取得
//   const beforeHashs = await Promise.all(
//     checkFileNames.map((fName) =>
//       getFileHash(assetsPath.child(`${targetWorldName}/${fName}`))
//     )
//   );
//   const okBeforeHashs = beforeHashs.filter((h) => h.isOk);
//   expect(okBeforeHashs.length).toBe(checkFileNames.length);

//   // データを展開
//   const res = await source.extractWorldData(targetWorldName);
//   expect(res.isOk).toBe(true);

//   // 展開後データのHashを取得
//   const afterHashs = await Promise.all(
//     checkFileNames.map((fName) =>
//       getFileHash(assetsPath.child(`${targetWorldName}/${fName}`))
//     )
//   );
//   const okAfterHashs = afterHashs.filter((h) => h.isOk);
//   expect(okAfterHashs.length).toBe(checkFileNames.length);

//   // Hashが変化していなければOK
//   for (let i = 0; i < checkFileNames.length; i++) {
//     expect(okBeforeHashs[i].value()).toBe(okAfterHashs[i].value());
//   }
