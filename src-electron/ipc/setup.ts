import { API } from 'src-electron/api/api';
import { linkIPC } from './link';
import { setBackAPI } from '../core/api';
import { BrowserWindow } from 'electron';

// フロントエンド
import { getFrontAPIListener, setFrontAPI } from './front';

// バックエンド
import { backListener } from './back';

export function setupIPC(mainwindowGetter: () => BrowserWindow | undefined) {
  const { back, front } = linkIPC<API>(
    backListener,
    getFrontAPIListener(mainwindowGetter)
  );
  setFrontAPI(front);
  setBackAPI(back);
}
