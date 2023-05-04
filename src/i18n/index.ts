import { Locale } from 'app/src-electron/schema/system';
import enUS from './en-US';

// 現状enUSのデータ型をスキーマとしている
type MessageSchema = typeof enUS;

// 言語を追加する場合
// 1. src-electron/schema/system Locale に言語コードを追加
// 2. src/i18n/{locale}/{locale}.tsを作成し内容を記述
// 3. このmassagesに追加
const massages: Record<Locale, MessageSchema> = {
  'en-US': enUS,
};

export default massages;
