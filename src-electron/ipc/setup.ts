import { API } from 'src-electron/api/api';
import { linkIPC } from './link';
import { BrowserWindow } from 'electron';

// フロントエンド
import { getFrontAPIListener, setFrontAPI } from './front';

// バックエンド

import { setBackAPI } from '../core/api';
import { getBackListener } from './back';

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
