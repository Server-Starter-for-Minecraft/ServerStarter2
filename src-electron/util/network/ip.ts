import { z } from 'zod';
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

/** 指定したIPアドレスが有効かどうか */
export function isValidIP(ip: string): boolean {
  const parser = z.string().ip();
  const result = parser.safeParse(ip);
  return result.success;
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test('ip validation', async () => {
    const ipv4Samples = [
      '192.168.1.1',
      '10.0.0.1',
      '172.16.254.1',
      '8.8.8.8',
      '127.0.0.1',
    ];
    const ipv6Samples = [
      '2001:db8:3333:4444:5555:6666:7777:8888',
      '2001:db8::',
      '::1',
      '2001:db8::1234:56',
      'fe80::394:a9b4:14d:7993',
      'fe80::1',
    ];

    for (const ip4 of ipv4Samples) {
      expect(isValidIP(ip4)).toBe(true);
    }
    for (const ip6 of ipv6Samples) {
      expect(isValidIP(ip6)).toBe(true);
    }
  });
}
