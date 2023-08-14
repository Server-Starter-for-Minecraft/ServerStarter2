export type LevelDat = {
  Data: {
    LevelName: string;
    Version: {
      //  Id:バージョンの識別子。
      /** 文字列でのバージョン名 */
      Name: string;
      //  Snapshot: 1または0 (true/false) - バージョンがスナップショットであったかどうか
    };
    // レベルが最後にロードされたUnix時間(ミリ秒)
    LastPlayed: number;
  };
};
