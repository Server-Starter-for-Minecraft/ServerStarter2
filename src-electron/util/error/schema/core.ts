import { ErrorMessageContent } from './base';

// ServerStarterの内部的なその他のエラー
export type CoreErrors = {
  world: {
    // idに対するワールドが存在しない
    invalidWorldId: ErrorMessageContent<{
      id: string;
    }>;

    // ワールドがすでに起動中
    worldAleradyRunning: ErrorMessageContent<{
      // ワールドのパス = {container}/{name}
      container: string;
      name: string;
      // 起動している人のUUID
      owner?: string;
    }>;
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
};
