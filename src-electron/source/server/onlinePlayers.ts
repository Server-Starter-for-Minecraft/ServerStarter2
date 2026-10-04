import { trimAnsi } from 'app/src-electron/util/ansi';

/** サーバーログから読み取れるプレイヤーの入退室イベント */
export type PlayerConnectionEvent = {
  type: 'join' | 'leave';
  /** ログに出力されたプレイヤー名 */
  name: string;
};

/** プレイヤー名として扱う文字列 (Minecraftのユーザー名の規則に準拠) */
const NAME = '([A-Za-z0-9_]{1,16})';
/** 名前変更直後のプレイヤーに付与される `(formerly known as OldName)` の表記 */
const FORMERLY = '(?: \\(formerly known as [A-Za-z0-9_]{1,16}\\))?';

/**
 * ログ行の先頭に付与されるヘッダー部分
 *
 * - `[12:00:00] [Server thread/INFO]: ` (Vanilla / Fabric 等)
 * - `[12:00:00] [Server thread/INFO] [minecraft/MinecraftServer]: ` (Forge / NeoForge / MohistMC 等)
 * - `[12:00:00 INFO]: ` (Spigot / Paper 等)
 * - `2013-07-10 12:00:00 [INFO] ` (1.6以前)
 * - `2013-07-10 12:00:00 [INFO] [Minecraft-Server] ` (1.6以前のForge)
 *
 * チャットや`/say`の内容は本文側に含まれるため，ヘッダーを厳密に判定することで誤検知を防ぐ
 * (1.6以前は`/say`の`[Server] `とヘッダーの区切りが同じ形式になるため，ロガー名を限定する)
 *
 * なお，チャットの書式をプラグイン等で`名前 本文`の形式に変更している場合は，
 * チャットの内容によって誤検知する可能性がある
 */
const LOG_HEADERS = [
  /^\[[^\]]+\](?: \[[^\]]+\])*: /,
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[\w+\](?: \[Minecraft-Server\])? /,
];

/**
 * ログ本文からプレイヤーの入退室を判定するパターン
 *
 * サーバーのバージョンや種別によって出力されるメッセージが異なるため，
 * 判定方法を追加する場合はこの配列にパターンを追加する
 * (同じ入退室で複数のパターンに一致しても結果は変わらない)
 */
const CONNECTION_PATTERNS: {
  type: PlayerConnectionEvent['type'];
  pattern: RegExp;
}[] = [
  // 参加メッセージ (プラグイン等で変更されている場合がある)
  { type: 'join', pattern: new RegExp(`^${NAME}${FORMERLY} joined the game$`) },
  // ログイン時のサーバー内部ログ (参加メッセージが変更されていても出力される)
  {
    type: 'join',
    pattern: new RegExp(`^${NAME} ?\\[[^\\]]*\\] logged in with entity id`),
  },
  // 退出メッセージ
  { type: 'leave', pattern: new RegExp(`^${NAME}${FORMERLY} left the game$`) },
  // 切断時のサーバー内部ログ (キックやタイムアウトも含む)
  { type: 'leave', pattern: new RegExp(`^${NAME} lost connection`) },
];

/**
 * サーバーログの1行からプレイヤーの入退室イベントを取得する
 *
 * @param line サーバーログの1行 (ANSIエスケープシーケンスは除去済みであること)
 * @returns 入退室に関するログであればそのイベント，それ以外はundefined
 */
export function parsePlayerConnection(
  line: string
): PlayerConnectionEvent | undefined {
  const trimmed = line.trim();
  const header = LOG_HEADERS.map((h) => trimmed.match(h)).find((m) => m);
  if (!header) return undefined;

  const body = trimmed.slice(header[0].length);
  for (const { type, pattern } of CONNECTION_PATTERNS) {
    const matched = body.match(pattern);
    if (matched) return { type, name: matched[1] };
  }
  return undefined;
}

/**
 * サーバーの標準出力を監視し，参加中のプレイヤー一覧を管理する
 *
 * 標準出力は行の途中で分割されて届く場合があるため，改行が届くまで内部でバッファリングする
 */
export class OnlinePlayersTracker {
  /** 参加中のプレイヤー名 (小文字化した名前 -> ログに出力された名前) */
  private players = new Map<string, string>();
  /** 改行がまだ届いていない行の断片 (標準出力と標準エラー出力で別々に保持) */
  private buffers = { stdout: '', stderr: '' };

  /**
   * @param onChange 参加中のプレイヤー一覧が変化した際に呼ばれる (引数は参加中のプレイヤー名一覧)
   */
  constructor(private readonly onChange: (players: string[]) => void) {}

  /** 参加中のプレイヤー名一覧 */
  get onlinePlayers(): string[] {
    return [...this.players.values()];
  }

  /**
   * サーバーの出力を読み込む
   *
   * ANSIエスケープシーケンスが出力の区切りをまたぐ場合があるため，除去は行単位で行う
   * 1.6以前のサーバーはログを標準エラー出力に出力するため，両方の出力を読み込む
   *
   * @param chunk サーバーの出力から受け取った文字列 (複数行や行の断片を含んでもよい)
   * @param isError 標準エラー出力から受け取った場合はtrue
   */
  push(chunk: string, isError = false) {
    const stream = isError ? 'stderr' : 'stdout';
    const lines = (this.buffers[stream] + chunk).split(/\r?\n/);
    this.buffers[stream] = lines.pop() ?? '';

    let changed = false;
    for (const line of lines) {
      const event = parsePlayerConnection(trimAnsi(line));
      if (event) changed = this.apply(event) || changed;
    }
    if (changed) this.onChange(this.onlinePlayers);
  }

  /** サーバー終了時などに参加中のプレイヤー一覧を空にする */
  reset() {
    this.buffers = { stdout: '', stderr: '' };
    if (this.players.size === 0) return;
    this.players.clear();
    this.onChange(this.onlinePlayers);
  }

  /**
   * 入退室イベントを反映する
   *
   * @returns 参加中のプレイヤー一覧が変化した場合はtrue
   */
  private apply(event: PlayerConnectionEvent): boolean {
    // Minecraftのユーザー名は大文字小文字を区別しない
    const key = event.name.toLowerCase();
    if (event.type === 'join') {
      if (this.players.get(key) === event.name) return false;
      this.players.set(key, event.name);
      return true;
    }
    return this.players.delete(key);
  }
}
