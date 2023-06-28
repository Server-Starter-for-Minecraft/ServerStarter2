// {k1:v1,k2:v2}を{key:k1,attr:v1}|{key:k2,attr:v2}に変換
export type KeyAttr<T extends object, A extends string> = {
  [K in keyof T]: {
    key: K;
  } & {
    [KA in A]: T[K];
  };
}[keyof T];

// 複数の選択肢の中のすべて/どれか一つを表す
export type Options<T> = {
  mode: 'all' | 'any';
  values: T[];
};

export type ErrorMessageTypes = {
  // システム内部で発生したランタイムエラー
  runtime: {
    // エラーの型
    type: string;
    // エラーの内容
    message: string;
  };

  // IPC通信で発生するエラー
  ipc: {
    channel: string;
    type:
      | 'invokeMainToWindow'
      | 'sendMainToWindow'
      | 'invokeWindowToMain'
      | 'sendWindowToMain';
    message: string;
  };

  subprocess: {
    processPath: string;
    args: string[];
    exitcode: number;
  };

  // URLからデータを取得する際のエラー
  fetchUrl: {
    url: string;
    status: number;
    statusText: string;
  };

  // ファイル/ディレクトリの読み込みに失敗したときのエラー
  failLoading: {
    path: string;
    contentType: string;
  };

  // 無効な値
  invalidValue: KeyAttr<InvalidValues, 'attr'>;

  // ファイルまたはディレクトリが存在しない
  pathNotFound: {
    type: 'file' | 'directory';
    path: string | Options<string>;
    // pathが相対パスの場合はその親のパスが入る
    parentPath?: string;
  };

  // ファイルまたはディレクトリの読み込みに失敗
  pathLoad: {
    type: 'file' | 'directory';
    path: string;
  };

  // ファイルまたはディレクトリの生成に失敗
  pathCreation: {
    type: 'file' | 'directory';
    path: string;
  };

  // ファイルまたはディレクトリの内容が無効
  invalidPathContent: {
    type: 'file' | 'directory';
    path: string;
    // どのような理由で無効なのか
    reason: KeyAttr<InvalidPathContentReasons, 'attr'>;
  };

  // hash値が合わない
  hashNotMatch: {
    hashtype: 'sha1' | 'md5' | 'sha256';
    type: 'url' | 'file';
    // URLまたはファイルパス
    path: string;
  };

  // gitのPATが存在しない場合
  missingPersonalAccessToken: {
    // https://github.com/{owner}/{repo}
    owner: string;
    repo: string;
  };

  // minecraftEulaに同意していない場合
  minecraftEULANotAccepted: undefined;

  // forgeのインストーラが提供されていない
  forgeInstallerNotProvided: {
    version: string;
  };

  // spiotのビルドに失敗した
  failSpigotBuild: {
    version: string;
    reason: KeyAttr<FailSpigotBuildReasons, 'attr'>;
  };

  // vanillaのバージョンが存在しない
  vanillaVersionNotExists: {
    id: string;
  };

  // idに対するワールドが存在しない
  invalidWorldId: {
    id: string;
  };

  // ワールドがすでに起動中
  worldAleradyRunning: {
    // ワールドのパス = {container}/{name}
    container: string;
    name: string;
    // 起動している人のUUID
    owner?: string;
  };
};

// Spigotのビルドが失敗した理由
export type FailSpigotBuildReasons = {
  // minVersion ~ maxVersionの間のJavaがインストールされている必要がある
  needJava: {
    minVersion: string;
    maxVersion: string;
  };
};

// 要素が無効である理由
export type InvalidPathContentReasons = {
  // run.bat run.sh 内に javaを起動するコマンドが存在しない
  missingJavaCommand: undefined;
  // ディレクトリである必要がある
  mustBeDirectory: undefined;
  // ファイルである必要がある
  mustBeFile: undefined;

  // 不適なプラグインファイル
  invalidPlugin: undefined;

  // 不適なModファイル
  invalidMod: undefined;

  // 設定ファイルの要件を満たしていない
  invalidSettingFile: 'worldSettingJson' | 'opsJson' | 'whitelistJson';
};

// 無効な値のキーとデータ型
export type InvalidValues = {
  playerName: string;
  playerUUID: string;
  playerNameOrUUID: string;
  base64URI: string;
  commandLineArgument: string;
  worldName: {
    name: string;
    // notMatchRegex: 文字列が正規表現にマッチしない
    // alreadyUsed: すでに同名のワールドが存在する
    reason: 'notMatchRegex' | 'alreadyUsed';
  };
};
