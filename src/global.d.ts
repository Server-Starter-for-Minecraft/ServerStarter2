import { FrontAPI } from 'app/src-electron/api/api';

declare global {
  interface Window {
    API: FrontAPI;
  }
}
