export type ErrorMessageTypes = {
  // ファイル/ディレクトリの読み込みに失敗したときのエラー
  failLoading: {
    path: string;
    contentType: string;
  };
};
