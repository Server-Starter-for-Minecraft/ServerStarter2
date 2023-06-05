import { WorldID } from '../schema/world';

export function openBrowser(url: string): void {
  console.log(`[openBrowser] url:${url}`);
}

export function openFolder(path: string): void {
  console.log(`[openFolder] path:${path}`);
}
