import { API } from 'src-electron/api/api';
import { linkIPC } from './link';
import { setBackAPI } from '../core/api';
import { BrowserWindow } from 'electron';

// フロントエンド
import { getFrontAPIListener, setFrontAPI } from './front';

// バックエンド
import { getBackListener } from './back';

export function setupIPC(mainwindowGetter: () => BrowserWindow | undefined) {
  const { back, front } = linkIPC<API>(
    getBackListener(mainwindowGetter),
    getFrontAPIListener(mainwindowGetter)
  );
  setFrontAPI(front);
  setBackAPI(back);
}
