export const properties = {
  parse(text: string) {
    const result: Record<string, string> = {};
    const unescape = (str: string) => {
      str = str.replaceAll(/\\([=:#!])/g, '$1');
      str = str.replaceAll('\\n', '\n');
      str = str.replaceAll('\\t', '\t');
      str = str.replaceAll('\\\\', '\\');
      return str;
    };
    text.split(/\n|\r/).forEach((line) => {
      if (line.startsWith('#') || line.startsWith('!')) return;
      const match = line.matchAll(/(?<!\\)[=:]/g);
      const matcharray: RegExpExecArray[] = Array.from(match);

      if (matcharray.length !== 1) return;

      const splitIndex = matcharray[0].index;
      let key = line.slice(0, splitIndex).trim();
      key = unescape(key);
      let value = line.slice(splitIndex + 1).trimStart();
      value = unescape(value);

      result[key] = value;
    });
    return result;
  },
  stringify(record: Record<string, string>) {
    const lines: string[] = [];
    const entries = Object.entries(record);
    const escape = (str: string) => {
      str = str.replaceAll('\\', '\\\\');
      str = str.replaceAll(/([=:#!])/g, '\\$1');
      str = str.replaceAll('\n', '\\n');
      str = str.replaceAll('\t', '\\t');
      return str;
    };
    entries.forEach(([key, value]) => {
      const line = `${escape(key)}=${escape(value.toString())}`;
      lines.push(line);
    });

    return lines.join('\n');
  },
};

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('parsetest', () => {
    expect(properties.parse('a=b')).toEqual({ a: 'b' });
    expect(properties.parse('a=b\nc=d')).toEqual({ a: 'b', c: 'd' });
    expect(properties.parse('a=b\r\nc=d')).toEqual({ a: 'b', c: 'd' });
    expect(properties.parse('a=b\rc=d')).toEqual({ a: 'b', c: 'd' });
    expect(properties.parse('a=b=c')).toEqual({});
    expect(properties.parse('a=b=c\nd=e')).toEqual({ d: 'e' });
    expect(properties.parse('a=b\n#c=d')).toEqual({ a: 'b' });
    expect(properties.parse('a=b\n!c=d')).toEqual({ a: 'b' });
    expect(properties.parse(' a =b')).toEqual({ a: 'b' });
    expect(properties.parse(' a = b ')).toEqual({ a: 'b ' });
    expect(properties.parse(' a = b c ')).toEqual({ a: 'b c ' });
    expect(properties.parse('a\\==b')).toEqual({ 'a=': 'b' });
    expect(properties.parse('a\\=\\==\\=\\=b\\=')).toEqual({ 'a==': '==b=' });
    expect(properties.parse('a\\:\\:=\\:\\:b\\:')).toEqual({ 'a::': '::b:' });
    expect(properties.parse('a:b')).toEqual({ a: 'b' });
    expect(properties.parse('\\\\a:b')).toEqual({ '\\a': 'b' });
    expect(properties.parse('\\\\\\:\\\\\\=:b')).toEqual({ '\\:\\=': 'b' });
    expect(properties.parse('\\#\\!:b')).toEqual({ '#!': 'b' });
    expect(properties.parse('\\n:b')).toEqual({ '\n': 'b' });
  });
  test('stringifyTest', () => {
    expect(properties.stringify({ a: 'b', c: 'd' })).toEqual('a=b\nc=d');
    expect(properties.stringify({ 'a=': 'b', c: 'd' })).toEqual('a\\==b\nc=d');
    expect(properties.stringify({ '\\:\\=': 'b' })).toEqual('\\\\\\:\\\\\\==b');
    expect(properties.stringify({ '#!': 'b' })).toEqual('\\#\\!=b');
    expect(properties.stringify({ '#!': 'b' })).toEqual('\\#\\!=b');
    expect(properties.stringify({ '\n': 'b' })).toEqual('\\n=b');
  });
}
