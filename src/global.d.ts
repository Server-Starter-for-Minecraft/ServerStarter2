import {
  FrontAPI,
  FrontConsoleAPI,
  FrontProgressAPI,
} from 'app/src-electron/api/frontend';

declare global {
  interface Window {
    API: FrontAPI;
    ProgressAPI: FrontProgressAPI;
    ConsoleAPI: FrontConsoleAPI;
  }
}
