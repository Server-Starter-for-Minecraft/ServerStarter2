import { OpLevel } from 'app/src-electron/schema/player';
import { ErrorMessageContent } from './base';

// ServerStarterの内部的なその他のエラー
export type CoreErrors = {
  world: {
    // idに対するワールドが存在しない
    invalidWorldId: ErrorMessageContent<{
      id: string;
      container?: string;
      name?: string;
    }>;

    // ポート番号が既に使用中
    serverPortIsUsed: ErrorMessageContent<{
      port: number;
    }>;

    // 実行中のワールド名/ワールドフォルダは変更できない
    cannotChangeRunningWorldName: ErrorMessageContent<{
      name: string;
      container: string;
    }>;

    // 実行中のワールドは複製できない
    cannotDuplicateRunningWorld: ErrorMessageContent<{
      name: string;
      container: string;
    }>;

    // ワールドがすでに起動中
    worldAleradyRunning: ErrorMessageContent<{
      // ワールドのパス = {container}/{name}
      container: string;
      name: string;
      // 起動している人のUUID
      owner?: string;
    }>;

    // opの権限の設定に失敗した場合
    failedChangingOp: ErrorMessageContent<{
      users: string[];
      op: OpLevel;
    }>;
  };

  // WorldContainer系のエラーまとめ
  container: {
    // WorldContainerが一つも登録されていない
    noContainerSubscribed: ErrorMessageContent;
  };

  // バージョン系のエラーまとめ
  version: {
    // forgeのインストーラが提供されていない
    forgeInstallerNotProvided: ErrorMessageContent<{
      version: string;
    }>;

    // spiotのビルドに失敗した
    failSpigotBuild: {
      // minVersion ~ maxVersionの間のJavaがインストールされている必要がある
      javaNeeded: ErrorMessageContent<{
        spigotVersion: string;
        minVersion: string;
        maxVersion: string;
      }>;

      // ビルド結果のjarファイルが存在しない
      missingJar: ErrorMessageContent<{
        spigotVersion: string;
      }>;
    };

    // vanillaのバージョンが存在しない
    vanillaVersionNotExists: ErrorMessageContent<{
      version: string;
    }>;
  };

  // gitのPATが存在しない場合
  missingPersonalAccessToken: ErrorMessageContent<{
    // https://github.com/{owner}/{repo}
    owner: string;
    repo: string;
  }>;

  // minecraftEulaに同意していない場合
  minecraftEULANotAccepted: ErrorMessageContent;

  // Datapack/Plugin/Modのキャッシュに失敗した場合
  failCacheAddiltionalData: ErrorMessageContent<{
    type: 'datapack' | 'plugin' | 'mod';
    path: string;
  }>;

  failGetGlobalIP: ErrorMessageContent;
};
