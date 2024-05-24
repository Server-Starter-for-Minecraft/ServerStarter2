import { BrowserWindow } from 'electron';
import { API } from 'src-electron/api/api';
// バックエンド
import { setBackAPI } from '../core/api';
import { getBackListener } from './back';
// フロントエンド
import { getFrontAPIListener, setFrontAPI } from './front';
import { linkIPC } from './link';

// import { setBackAPI } from '../dummy/api';
// import { getBackListener } from './dummy_back';

export function setupIPC(mainwindowGetter: () => BrowserWindow | undefined) {
  const { back, front } = linkIPC<API>(
    getBackListener(mainwindowGetter),
    getFrontAPIListener(mainwindowGetter)
  );
  setFrontAPI(front);
  setBackAPI(back);
}
