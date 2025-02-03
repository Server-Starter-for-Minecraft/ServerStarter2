import { Failable } from '../../schema/error';
import { BytesData } from '../binary/bytesData';
import { errorMessage } from '../error/construct';
import { isValid } from '../error/error';

type IpinfoSchema = {
  ip: string;
  hostname: string;
  city: string;
  region: string;
  country: string;
  loc: string;
  org: string;
  postal: string;
  timezone: string;
  readme: 'https://ipinfo.io/missingauth';
};

/** globalIPを取得 000.00.00.000 */
export async function getGlobalIP(): Promise<Failable<string>> {
  // https://ipv4.icanhazip.com から取得
  const icanhazip = await BytesData.fromURL('https://ipv4.icanhazip.com');
  if (isValid(icanhazip)) {
    return (await icanhazip.text()).trim();
  }

  // フォールバック
  // https://ipinfo.io/json から取得
  const ipinfo = await BytesData.fromURL('https://ipinfo.io/json');
  if (isValid(ipinfo)) {
    const ipinfoJson = await ipinfo.json<IpinfoSchema>();
    if (isValid(ipinfoJson)) {
      return ipinfoJson.ip;
    }
  }

  // フォールバック
  // https://api.ipify.org から取得
  const ipify = await BytesData.fromURL('https://api.ipify.org');
  if (isValid(ipify)) {
    return (await ipify.text()).trim();
  }

  return errorMessage.core.failGetGlobalIP();
}
