import { WorldID } from 'app/src-electron/schema/world';

/** スクロール領域の状態（QScrollAreaのscrollイベントの値に対応） */
export type ScrollInfo = {
  /** 現在のスクロール位置(px) */
  position: number;
  /** スクロールする内容全体の高さ(px) */
  contentSize: number;
  /** 表示領域の高さ(px) */
  containerSize: number;
};

/** 最下部とみなす余白(px)（端数やサブピクセルの誤差を許容する） */
const BOTTOM_THRESHOLD = 24;

/**
 * 表示領域が内容の最下部までスクロールされているか
 *
 * @param info スクロール領域の状態
 * @returns 最下部（または内容が表示領域に収まっている）場合はtrue
 */
export function isScrolledToBottom(info: ScrollInfo): boolean {
  return (
    info.contentSize - (info.position + info.containerSize) <= BOTTOM_THRESHOLD
  );
}

/** 表示を復元するスクロール位置（`bottom` は最下部） */
export type ScrollTarget = number | 'bottom';

/**
 * ワールドごとにコンソールのスクロール状態を記憶する
 *
 * - 最下部を表示している間は、新しい出力に追従して最下部を表示し続ける
 * - 過去の出力を読むためにスクロールした場合は、その位置を保持する
 * - 表示するワールドを切り替えても、ワールドごとのスクロール状態を復元できる
 */
export class ConsoleScrollMemory {
  private states = new Map<WorldID, { position: number; atBottom: boolean }>();

  /**
   * ユーザーの操作などでスクロールした際の状態を記録する
   *
   * @param worldID コンソールを表示しているワールド
   * @param info スクロール領域の状態
   */
  record(worldID: WorldID, info: ScrollInfo) {
    this.states.set(worldID, {
      position: info.position,
      atBottom: isScrolledToBottom(info),
    });
  }

  /**
   * コンソールに出力が追加された際に、最下部へ追従するか
   *
   * @param worldID コンソールを表示しているワールド
   * @returns 最下部を表示していた（またはまだスクロールしていない）場合はtrue
   */
  shouldFollowOutput(worldID: WorldID): boolean {
    return this.states.get(worldID)?.atBottom ?? true;
  }

  /**
   * ワールドのコンソールを表示し直す際に復元するスクロール位置
   *
   * @param worldID 表示するワールド
   * @returns 最下部に追従していた（または初めて表示する）場合は`bottom`、それ以外は記録した位置
   */
  restoreTarget(worldID: WorldID): ScrollTarget {
    const state = this.states.get(worldID);
    if (state === undefined || state.atBottom) return 'bottom';
    return state.position;
  }
}

/**
 * アプリ全体で共有するコンソールのスクロール状態
 *
 * サーバーの状態の変化などでコンソールの表示コンポーネントが作り直されても、状態を保持できるようにする
 */
export const consoleScrollMemory = new ConsoleScrollMemory();
