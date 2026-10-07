import type { MessageSchema } from 'src/boot/i18n';
import type { ContentType } from './contentActions';

/**
 * 追加コンテンツを選ぶダイアログ（window.API.invokePickDialog）に渡すオプション
 *
 * 新しい導入方法（例：MODをフォルダーから追加）を増やす場合は、
 * バックエンドのPickDialogの対応に合わせてここに追加する
 */
export type ContentPickOption =
  { type: 'datapack'; isFile: boolean } | { type: 'plugin' } | { type: 'mod' };

/** 追加コンテンツ画面の文言のi18nキー */
type ContentsMessageKey =
  `additionalContents.${keyof MessageSchema['additionalContents'] & string}`;

/** 追加コンテンツを新規導入する操作（ボタン1つ分）の定義 */
export type ContentImportAction = {
  /** 一覧描画時のキー */
  key: string;
  /** ボタンの表示名（i18nキー） */
  labelKey: ContentsMessageKey;
  /** ボタンに表示するアイコン */
  icon: string;
  /** ボタンを押した時に開くダイアログのオプション */
  pickOption: ContentPickOption;
};

/**
 * 指定した種別の追加コンテンツを新規導入する操作の一覧を返す
 *
 * データパックはzipとフォルダーのどちらからも導入できるため2つ、
 * プラグインとMODはファイルからのみ導入できるため1つの操作を返す
 *
 * @param contentType 追加コンテンツの種別
 * @returns 画面に並べる新規導入ボタンの定義
 */
export function getImportActions(
  contentType: ContentType
): ContentImportAction[] {
  switch (contentType) {
    case 'datapack':
      return [
        {
          key: 'zip',
          labelKey: 'additionalContents.installFromZip',
          icon: 'folder_zip',
          pickOption: { type: 'datapack', isFile: true },
        },
        {
          key: 'folder',
          labelKey: 'additionalContents.installFromFolder',
          icon: 'create_new_folder',
          pickOption: { type: 'datapack', isFile: false },
        },
      ];
    case 'plugin':
    case 'mod':
      return [
        {
          key: 'file',
          labelKey: 'additionalContents.newInstall',
          icon: 'note_add',
          pickOption: { type: contentType },
        },
      ];
  }
}
