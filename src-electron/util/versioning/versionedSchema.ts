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
 *
 * 注意：新しいバージョンのアプリで保存された設定ファイルを古いバージョンのアプリで読み込むと、
 * 古いスキーマで解釈できない項目は読み込まれず、そのまま保存すると失われる。
 * また、項目の改名や型の変更は古いアプリで読み込めなくなる（既定値に戻る）原因となるため、
 * スキーマの変更はできるだけ項目の追加にとどめる。
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
    // 変換処理が入れ子の値を直接変更しても呼び出し元の値に影響しないよう、複製してから変換する
    let data: RawSettings = isRawSettings(raw) ? structuredClone(raw) : {};
    for (let v = this.versionOf(raw); v < this.latestVersion; v++) {
      data = this.migrations[v](data);
    }
    delete data[SCHEMA_VERSION_KEY];
    return data;
  }

  /**
   * 設定ファイルの内容を最新のスキーマに変換して検証する
   *
   * 変換処理が例外を投げた場合（想定外の形式の内容を変換しようとした場合など）も、検証の失敗として返す。
   *
   * @param raw 設定ファイルの内容
   * @returns 検証の結果（zodのsafeParseと同じ形式）
   */
  safeParse(raw: unknown): z.ZodSafeParseResult<T> {
    let migrated: RawSettings;
    try {
      migrated = this.migrate(raw);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      return {
        success: false,
        // 変換に失敗した時点では最新のスキーマとして検証していないため、キャストでエラーの型を合わせる
        error: new z.ZodError([
          {
            code: 'custom',
            path: [],
            message: `Failed to migrate settings: ${reason}`,
            input: raw,
          },
        ]) as z.ZodError<T>,
      };
    }
    return this.schema.safeParse(migrated);
  }

  /**
   * 設定ファイルの内容を最新のスキーマに変換して検証する（検証に失敗した場合は例外を投げる）
   *
   * @param raw 設定ファイルの内容
   * @returns 最新のスキーマの値
   */
  parse(raw: unknown): T {
    // 変換処理の失敗も含めて、safeParseと同じ基準で失敗を判定する
    const result = this.safeParse(raw);
    if (!result.success) throw result.error;
    return result.data;
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
