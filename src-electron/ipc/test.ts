import { api } from '../core/api';

export async function testHandle(value: string): Promise<string> {
  api.send.SMWTest(`HANDLE:${value}`);
  const result = await api.invoke.IMWTest(`HANDLE:${value}`);
  return `invoke:${result}`;
}

export function testOn(value: string): void {
  api.send.SMWTest(`ON:${value}`);
  console.log('ON:', value);
}
