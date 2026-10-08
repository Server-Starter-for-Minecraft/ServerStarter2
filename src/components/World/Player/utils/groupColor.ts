import { keys, values } from 'app/src-public/scripts/obj/obj';
import { MinecraftColors } from 'app/src-electron/schema/static';

/**
 * グループの色コードに対応する染料の名前（染料・羊毛の画像の名前）を返す
 *
 * @param label2code 染料の名前と色コードの対応（システムの静的リソース）
 * @param color グループの色コード
 * @returns 染料の名前（未定義の色コードの場合は白）
 */
export const getColorLabel = (
  label2code: MinecraftColors,
  color: string
): keyof MinecraftColors => {
  const index = values(label2code).findIndex(
    (code) => code.toUpperCase() === color.toUpperCase()
  );
  return index === -1 ? 'white' : keys(label2code)[index];
};
