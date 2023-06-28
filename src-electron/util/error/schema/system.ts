import { ErrorMessageContent } from "./base";

  // システムから投げられるエラー
export type SystemErrors = {
    // ランタイムエラー
    runtime: ErrorMessageContent<{
      // エラーの型
      type: string;
      // エラーの内容
      message: string;
    }>;
    // IPC通信で発生するエラー
    ipc: ErrorMessageContent<{
      channel: string;
      type:
        | 'invokeMainToWindow'
        | 'sendMainToWindow'
        | 'invokeWindowToMain'
        | 'sendWindowToMain';
      message: string;
    }>;
    subprocess: ErrorMessageContent<{
      processPath: string;
      args: string[];
      exitcode: number;
    }>;
  };