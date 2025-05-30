import { ErrorMessageContent } from './base';

type PathErrorContent = ErrorMessageContent<{
  type: 'file' | 'directory';
  path: string;
}>;

// ファイルやURL等データに関するエラー
export type DataErrors = {
  url: {
    // URLからデータを取得する際のエラー
    fetch: ErrorMessageContent<{
      url: string;
      status: number;
      statusText: string;
    }>;

    // リクエストが多すぎたときのエラー
    tooManyRequest: ErrorMessageContent<{
      url: string;
    }>;
  };

  zip: {
    // 無効なzipファイルである場合
    invalidZipFile: ErrorMessageContent<{
      // パス
      path: string;
    }>;
    // zipの中のパスのデータがファイルではなくディレクトリである場合
    isDir: ErrorMessageContent<{
      // パス
      path: string;
      // zipの内部のパス
      innerPath: string;
    }>;
  };

  path: {
    // ファイル/ディレクトリの読み込みに失敗したときのエラー
    loadingFailed: PathErrorContent;

    // ファイル/ディレクトリのリネームに失敗したときのエラー
    renameFailed: PathErrorContent;

    // ファイルまたはディレクトリがすでに存在する
    alreadyExists: PathErrorContent;

    // ファイルまたはディレクトリが存在しない
    notFound: PathErrorContent;

    // ファイルの拡張子が異なる場合
    invalidExt: ErrorMessageContent<{
      path: string;
      expectedExt: string;
    }>;

    // ファイルまたはディレクトリの内容が無効
    invalidContent: PathContentErrors;

    // ファイルまたはディレクトリの生成に失敗
    creationFailed: PathErrorContent;

    // ファイルまたはディレクトリの削除に失敗
    deletionFailed: PathErrorContent;

    // ファイルまたはディレクトリのコピーに失敗
    copyFailed: PathErrorContent;

    // ファイルまたはディレクトリの移動に失敗
    moveFailed: PathErrorContent;

    // ファイル選択ウィンドウがキャンセルされた場合
    dialogCanceled: ErrorMessageContent;

    // electron.shellの操作から帰ってくる不明なエラー
    // 内容はmessageにはいる
    shellError: ErrorMessageContent<{
      type: 'file' | 'directory';
      path: string;
      message: string;
    }>;
  };

  // githubAPI周りのエラー
  githubAPI: {
    // データの取得に失敗した場合
    fetchFailed: ErrorMessageContent<{
      url: string;
    }>;

    // blobのencodingがbase64/utf-8以外の場合
    unknownBlobEncoding: ErrorMessageContent<{
      encoding: string;
      url: string;
    }>;

    // WorldDataの構造が不正な場合
    invalidWorldData: ErrorMessageContent<{
      owner: string;
      repo: string;
      branch: string;
    }>;
  };

  // jsonのデータ修正に失敗した場合
  failJsonFix: ErrorMessageContent;

  // hash値が合わない
  hashNotMatch: ErrorMessageContent<{
    hashtype: 'sha1' | 'md5' | 'sha256';
    type: 'url' | 'file';
    // URLまたはファイルパス
    path: string;
  }>;
};

// 要素が無効である理由
export type PathContentErrors = {
  // run.bat run.sh 内に javaを起動するコマンドが存在しない
  missingJavaCommand: PathErrorContent;
  // ディレクトリである必要がある
  mustBeDirectory: PathErrorContent;
  // ファイルである必要がある
  mustBeFile: PathErrorContent;

  // 不適なデータパックファイル
  invalidDatapack: PathErrorContent;

  // 不適なプラグインファイル
  invalidPlugin: PathErrorContent;

  // 不適なModファイル
  invalidMod: PathErrorContent;

  // 不適なカスタムマップ
  invalidCustomMap: PathErrorContent;

  // level.datが複数格納されたカスタムマップのzipファイル
  customMapZipWithMultipleLevelDat: ErrorMessageContent<{
    // .zipのパス
    path: string;
    // zipファイル内部のパス
    innderPath: string[];
  }>;

  // 設定ファイルの要件を満たしていない
  invalidWorldSettingJson: PathErrorContent;
  invalidOpsJson: PathErrorContent;
  invalidWhitelistJson: PathErrorContent;
};
