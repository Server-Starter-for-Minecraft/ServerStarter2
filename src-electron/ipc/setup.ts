import { API } from 'src-electron/api/api';
import { linkIPC } from './link';
import { setBackAPI } from '../core/api';
import { BrowserWindow } from 'electron';

// フロントエンド
import { getFrontAPIListener, setFrontAPI } from './front';

// バックエンド
import { backListener } from './back';

// テスト用バックエンド
// import { backListener } from './dummy_back';

export function setupIPC(mainwindow: BrowserWindow) {
  const { back, front } = linkIPC<API>(
    backListener,
    getFrontAPIListener(mainwindow)
  );
  setFrontAPI(front);
  setBackAPI(back);
}
