import { z } from 'zod';

/** 設定ファイルにスキーマのバージョンを記録するキー */
export const SCHEMA_VERSION_KEY = 'schemaVersion';

/** 設定ファイルの内容（スキーマのバージョンにより形式が異なるため、型は確定しない） */
export type RawSettings = Record<string, unknown>;

/**
 * あるバージョンのスキーマから、次のバージョンのスキーマへ変換する処理
 *
 * `migrations[n]` は、バージョン `n` の内容をバージョン `n + 1` の内容へ変換する
 */
export type Migration = (data: RawSettings) => RawSettings;

/**
 * スキーマのバージョンを管理する設定ファイルの形式
 *
 * 設定ファイルにはスキーマのバージョンを記録し、読み込み時に古いバージョンの内容を
 * 最新のスキーマへ順に変換してから検証する。
 * スキーマを変更する場合は、変換処理を `migrations` の末尾に追加する（最新のバージョンは変換処理の数となる）。
 * バージョンが記録されていない設定ファイルは、バージョン管理を導入する前の内容（バージョン0）とみなす。
 */
export class VersionedSchema<T extends object> {
  private schema: z.ZodType<T>;
  private migrations: Migration[];

  /**
   * @param schema 最新のスキーマ
   * @param migrations 各バージョンから次のバージョンへの変換処理（バージョン0からの変換を先頭に、順に並べる）
   */
  constructor(schema: z.ZodType<T>, migrations: Migration[]) {
    this.schema = schema;
    this.migrations = migrations;
  }

  /** 最新のスキーマのバージョン */
  get latestVersion() {
    return this.migrations.length;
  }

  /**
   * 設定ファイルの内容に記録されたスキーマのバージョンを返す
   *
   * @param raw 設定ファイルの内容
   * @returns スキーマのバージョン（記録されていない・不正な場合は0）
   */
  versionOf(raw: unknown): number {
    if (!isRawSettings(raw)) return 0;
    const version = raw[SCHEMA_VERSION_KEY];
    return typeof version === 'number' &&
      Number.isInteger(version) &&
      version >= 0
      ? version
      : 0;
  }

  /**
   * 設定ファイルの内容を最新のスキーマの形式に変換する
   *
   * 新しいバージョンのServerStarter2で保存された（最新よりも新しいバージョンの）内容は変換せずに返す。
   * その場合も、最新のスキーマで解釈できる項目は読み込まれる。
   *
   * @param raw 設定ファイルの内容
   * @returns 最新のスキーマの形式に変換した内容（検証は行わない）
   */
  migrate(raw: unknown): RawSettings {
    let data: RawSettings = isRawSettings(raw) ? { ...raw } : {};
    for (let v = this.versionOf(raw); v < this.latestVersion; v++) {
      data = this.migrations[v](data);
    }
    delete data[SCHEMA_VERSION_KEY];
    return data;
  }

  /**
   * 設定ファイルの内容を最新のスキーマに変換して検証する
   *
   * @param raw 設定ファイルの内容
   * @returns 検証の結果（zodのsafeParseと同じ形式）
   */
  safeParse(raw: unknown) {
    return this.schema.safeParse(this.migrate(raw));
  }

  /**
   * 設定ファイルに書き出す内容に、スキーマのバージョンを付与する
   *
   * @param value 最新のスキーマの値
   * @returns スキーマのバージョンを付与した、設定ファイルに書き出す内容
   */
  serialize(value: T): T & { [SCHEMA_VERSION_KEY]: number } {
    return { ...value, [SCHEMA_VERSION_KEY]: this.latestVersion };
  }
}

/** 設定ファイルの内容として扱えるオブジェクトか */
function isRawSettings(value: unknown): value is RawSettings {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
