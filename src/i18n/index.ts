import { Locale } from 'app/src-electron/schema/system';
import { ja } from './ja';
import { enUS } from './en-US';

// 現状jaのデータ型をスキーマとしている
type MessageSchema = typeof ja;

// 言語を追加する場合
// 1. src-electron/schema/system Locale に言語コードを追加
// 2. src/i18n/{locale}/{locale}.tsを作成し内容を記述
// 3. このmessagesに追加
const messages: Record<Locale, MessageSchema> = {
  'en-US': enUS,
  ja: ja,
};

export default messages;
