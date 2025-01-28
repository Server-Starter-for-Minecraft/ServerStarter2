import { UUID } from '../../schema/brands';
import { errorMessage } from '../error/construct';
import { Failable } from '../error/failable';

const crypto = require('crypto');
//export const uuid:string = crypto.randomUUID()

// export function genUUID():string{
//   const uuid:string = crypto.randomUUID()
//   return uuid
// }
/**UUIDの生成関数(フォーマット済み) */
export const genUUID = () => UUID.parse(crypto.randomUUID());

/**
 * uuidの文字列を正規化する
 * 0-0-0-0-0
 * 00000000000000000000000000000000
 * 00000000-0000-0000-0000-000000000000
 *
 * -> 00000000-0000-0000-0000-000000000000
 */
export function formatUUID(uuid: string): Failable<string> {
  const hyphen_match = uuid.match(
    /([0-9a-f-]{1,8})-([0-9a-f-]{1,4})-([0-9a-f-]{1,4})-([0-9a-f-]{1,4})-([0-9a-f-]{1,12})/
  );

  if (hyphen_match !== null) {
    const result = [
      hyphen_match[1].padEnd(8, '0'),
      hyphen_match[2].padEnd(4, '0'),
      hyphen_match[3].padEnd(4, '0'),
      hyphen_match[4].padEnd(4, '0'),
      hyphen_match[5].padEnd(12, '0'),
    ].join('-');
    return result;
  }

  const non_hyphen_match = uuid.match(/([0-9a-f]{32})/);
  if (non_hyphen_match !== null) {
    const result = [
      uuid.slice(0, 8),
      uuid.slice(8, 12),
      uuid.slice(12, 16),
      uuid.slice(16, 20),
      uuid.slice(20, 32),
    ].join('-');
    return result;
  }

  return errorMessage.system.runtime({
    type: 'UUIDFormat',
    message: uuid,
  });
}
