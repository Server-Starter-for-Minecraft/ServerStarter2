import { BrowserWindow } from 'electron';
import { API } from 'src-electron/api/api';
// バックエンド
import { setBackAPI } from '../core/api';
import { getBackListener } from './back';
// フロントエンド
import { getFrontAPIListener, setFrontAPI } from './front';
import { linkIPC } from './link';

export function setupIPC(mainwindowGetter: () => BrowserWindow | undefined) {
  const { back, front } = linkIPC<API>(
    getBackListener(mainwindowGetter),
    getFrontAPIListener(mainwindowGetter)
  );
  setFrontAPI(front);
  setBackAPI(back);
}
