export type ErrorMessageTypes = {
  // システム内部で発生したランタイムエラー
  runtime: {
    // エラーの型
    type: string;
    // エラーの内容
    message: string;
  };

  // ファイル/ディレクトリの読み込みに失敗したときのエラー
  failLoading: {
    path: string;
    contentType: string;
  };
};
