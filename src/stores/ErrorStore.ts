import { defineStore } from 'pinia';

export const useErrorStore = defineStore('errorStore', {
  state: () => {
    return {
      description: '不明なエラーが発生しました。',
      error: 'エラー要因を表示できませんでした。',
    };
  },
});
