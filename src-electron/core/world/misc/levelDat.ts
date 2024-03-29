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
    // hardcore
    hardcore: boolean;
    // 難易度 0はサバイバル, 1はクリエイティブ, 2はアドベンチャー, 3はスペクテイター
    GameType: 0 | 1 | 2 | 3;
    // difficulty 0はピースフル、1はイージー、2はノーマル、3はハード
    Difficulty: 0 | 1 | 2 | 3;
  };
};
