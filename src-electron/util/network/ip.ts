import { z } from 'zod';
import { Failable } from '../../schema/error';
import { BytesData } from '../binary/bytesData';
import { errorMessage } from '../error/construct';
import { isError, isValid } from '../error/error';
import { utilLoggers } from '../utilLogger';

const IpinfoSchema = z.object({
  ip: z.string(),
  hostname: z.string(),
  city: z.string(),
  region: z.string(),
  country: z.string(),
  loc: z.string(),
  org: z.string(),
  postal: z.string(),
  timezone: z.string(),
  readme: z.literal('https://ipinfo.io/missingauth'),
});
type IpinfoSchema = z.infer<typeof IpinfoSchema>;

/**
 * globalIPの取得先（先頭から順に試す）
 *
 * 取得先が使えない場合に備えて，複数の取得先を用意している
 */
const GLOBAL_IP_SOURCES: {
  url: string;
  parse: (data: BytesData) => Promise<Failable<string>>;
}[] = [
  // https://ipv4.icanhazip.com から取得
  {
    url: 'https://ipv4.icanhazip.com',
    parse: async (data) => (await data.text()).trim(),
  },
  // https://ipinfo.io/json から取得
  {
    url: 'https://ipinfo.io/json',
    parse: async (data) => {
      const json = await data.json(IpinfoSchema);
      return isError(json) ? json : json.ip;
    },
  },
  // https://api.ipify.org から取得
  {
    url: 'https://api.ipify.org',
    parse: async (data) => (await data.text()).trim(),
  },
];

/** globalIPを取得 000.00.00.000 */
export async function getGlobalIP(): Promise<Failable<string>> {
  for (const { url, parse } of GLOBAL_IP_SOURCES) {
    const data = await BytesData.fromURL(url);
    const ip = isError(data) ? data : await parse(data);
    if (isValid(ip)) return ip;
    // 次の取得先で再試行する（すべて失敗した場合のみエラーを返すため，各取得先の失敗はログに残す）
    utilLoggers().getGlobalIP({ url }).warn(ip);
  }
  return errorMessage.core.failGetGlobalIP();
}

/** 指定したIPアドレスが有効かどうか */
export function isValidIP(ip: string): boolean {
  const parser = z.union([z.ipv4(), z.ipv6()]);
  const result = parser.safeParse(ip);
  return result.success;
}

/** In Source Testing */
if (import.meta.vitest) {
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
