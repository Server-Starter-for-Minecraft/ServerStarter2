import { defineStore } from 'pinia';
import { useMainStore } from '../MainStore';

export const useConsoleOpeStore = defineStore('consoleOperationStore', {
  state: () => {
    return {
      isSearchVisible: false,
      showIdx: 0,
      inputCommands: [] as string[],
      command: '',
    };
  },
  actions: {
    /**
     * コマンドの送信
     */
    sendCommand(sendCommand?: string) {
      const mainStore = useMainStore();
      const command = sendCommand ?? this.command;

      if (command !== '') {
        // 直前と同じコマンドが指定された場合は履歴に登録しない
        if (this.inputCommands[this.inputCommands.length - 1] !== command) {
          this.inputCommands.push(command);
          this.showIdx = this.inputCommands.length;
        }
        // コマンド実行
        window.API.sendCommand(mainStore.selectedWorldID, command);
        this.command = '';
      }
    },
    /**
     * コマンド入力欄で↑キーを押されたときに直前のコマンドを表示する
     */
    upKey() {
      this.showIdx--;
      if (this.showIdx < 0) this.showIdx = 0;
      this.command = this.inputCommands[this.showIdx];
    },
    /**
     * コマンド入力欄で↓キーを押されたときに直後のコマンドを表示する
     */
    downKey() {
      this.showIdx++;
      if (this.showIdx > this.inputCommands.length)
        this.showIdx = this.inputCommands.length;
      this.command = this.inputCommands[this.showIdx];
    },
  },
});
