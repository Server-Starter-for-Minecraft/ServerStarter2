// 以下のimportは灰色になっていても使用しているため，削除不可
/// <reference types="@quasar/app-vite" />
import { DefineDateTimeFormat } from 'vue-i18n';
import { FrontAPI } from 'app/src-electron/api/api';

declare global {
  interface Window {
    API: FrontAPI;
  }
}

declare module 'vue-i18n' {
  export interface DefineDateTimeFormat {
    date: {
      year: 'numeric';
      month: 'short';
      day: 'numeric';
    };
    dateTime: {
      year: 'numeric';
      month: 'short';
      day: 'numeric';
      weekday: 'short' | 'long';
      hour: 'numeric';
      minute: 'numeric';
    };
  }
}
