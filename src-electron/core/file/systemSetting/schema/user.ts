import { genUUID } from 'app/src-electron/tools/uuid';
import { fixConst } from '../../base/fixer/const';
import { fixObject } from '../../base/fixer/object';
import { fixBoolean, fixNumber, fixString } from '../../base/fixer/primitive';

/** 言語 */
export type Locale$1 = 'ja' | 'en-US';
export const Locale$1 = fixConst<Locale$1>('ja', 'en-US');

export type ColorTheme$1 = 'light' | 'auto' | 'dark';
export const ColorTheme$1 = fixConst<ColorTheme$1>('light', 'auto', 'dark');

export type UserSettings$1 = {
  // ServerStarterの利用規約同意状況
  eula: boolean;

  // カラーテーマ Light/Dark
  theme: ColorTheme$1;

  // 色覚サポート
  visionSupport: boolean;

  // システム言語
  language: Locale$1;

  // 実行者情報
  owner: string | undefined;

  /** 実行環境ID(特に変更の必要なし) */
  id: string;

  // 自動シャットダウン
  autoShutDown: boolean;

  // ワールドリストの幅
  drawerWidth: number;

  // NgrokのToken
  ngrokToken?: string;
};

const defaultUserSettings$1: UserSettings$1 = {
  eula: false,

  // カラーテーマ Light/Dark
  theme: 'auto',

  // 色覚サポート
  visionSupport: false,

  // システム言語
  language: 'ja',

  // 実行者情報
  owner: undefined,

  /** 実行環境ID(特に変更の必要なし) */
  id: genUUID(),

  // 自動シャットダウン
  autoShutDown: false,

  // ワールドリストの幅
  drawerWidth: 300,

  // NgrokのToken
  ngrokToken: undefined,
};

export const UserSettings$1 = fixObject<UserSettings$1>({
  // ServerStarterの利用規約同意状況
  eula: fixBoolean.default(defaultUserSettings$1.eula),

  // カラーテーマ Light/Dark
  theme: ColorTheme$1.default(defaultUserSettings$1.theme),

  // 色覚サポート
  visionSupport: fixBoolean.default(defaultUserSettings$1.visionSupport),

  // システム言語
  language: Locale$1.default(defaultUserSettings$1.language),

  // 実行者情報
  owner: fixString.optional(),

  /** 実行環境ID(特に変更の必要なし) */
  id: fixString,

  // 自動シャットダウン
  autoShutDown: fixBoolean.default(defaultUserSettings$1.autoShutDown),

  // ワールドリストの幅
  drawerWidth: fixNumber.default(defaultUserSettings$1.drawerWidth),

  // NgrokのToken
  ngrokToken: fixString.optional(),
}).default(defaultUserSettings$1);
