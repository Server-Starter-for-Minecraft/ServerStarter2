import { ProgressMessage } from 'app/src-electron/schema/progressMessage';
import {
  ConsoleProgress,
  GroupProgress,
  NumericProgress,
  NumericProgressUnit,
  Progress,
  SubtitleProgress,
  TitleProgress,
} from '../../schema/progress';
import { api } from '../api';
import { WorldID } from 'app/src-electron/schema/world';

export abstract class Progressor<T extends Progress> {
  parent?: GroupProgressor;
  protected updated = false;

  constructor(parent?: GroupProgressor) {
    this.parent = parent;
  }

  protected update() {
    // 変更を通知
    if (this.updated) return;
    this.updated = true;
    this.parent?.update();
  }

  delete() {
    if (this.parent) {
      this.parent.subs = this.parent.subs.filter((x) => x === this);
      this.parent.update();
    }
  }

  abstract export(): T;
}

export class TitleProgressor extends Progressor<TitleProgress> {
  private _title: ProgressMessage;

  constructor(title: ProgressMessage, parent?: GroupProgressor) {
    super(parent);
    this._title = title;
    this.update();
  }

  set title(val: ProgressMessage) {
    this._title = val;
    this.update();
  }

  export(): TitleProgress {
    return {
      type: 'title',
      value: this._title,
    };
  }
}

export class SubtitleProgressor extends Progressor<SubtitleProgress> {
  private _subtitle: ProgressMessage;

  constructor(subtitle: ProgressMessage, parent?: GroupProgressor) {
    super(parent);
    this._subtitle = subtitle;
    this.update();
  }

  set subtitle(val: ProgressMessage) {
    this._subtitle = val;
    this.update();
  }

  export(): SubtitleProgress {
    return {
      type: 'subtitle',
      value: this._subtitle,
    };
  }
}

export class NumericProgressor extends Progressor<NumericProgress> {
  private _value = 0;
  private _max?: number;
  private _unit?: NumericProgressUnit;

  constructor(
    unit?: NumericProgressUnit,
    max?: number,
    parent?: GroupProgressor
  ) {
    super(parent);
    this._unit = unit;
    this._max = max;
    this.update();
  }

  set value(value: number) {
    this._value = value;
    this.update();
  }

  set max(value: number) {
    this._max = value;
    this.update();
  }

  set unit(value: NumericProgressUnit | undefined) {
    this._unit = value;
    this.update();
  }

  export(): NumericProgress {
    return {
      type: 'numeric',
      max: this._max,
      unit: this._unit,
      value: this._value,
    };
  }
}

export class ConsoleProgressor extends Progressor<ConsoleProgress> {
  private _console: string[];
  private _maxLineCount?: number;

  /** maxLineCount : コンソールに保存する最大行数 */
  constructor(maxLineCount?: number, parent?: GroupProgressor) {
    super(parent);
    this._maxLineCount = maxLineCount;
    this._console = [];
    this.update();
  }

  push(chunk: string) {
    this._console.push(chunk);

    // コンソールの長さが指定値を超えた場合手前から削除
    if (
      this._maxLineCount !== undefined &&
      this._console.length > this._maxLineCount
    ) {
      this._console.shift();
    }

    this.update();
  }

  export(): ConsoleProgress {
    return {
      type: 'console',
      value: this._console,
    };
  }
}

export class GroupProgressor extends Progressor<GroupProgress> {
  subs: Progressor<Progress>[];

  constructor(parent?: GroupProgressor) {
    super(parent);
    this.subs = [];
    this.update();
  }

  export(): GroupProgress {
    return {
      type: 'group',
      value: this.subs.map((x) => x.export()),
    };
  }

  subGroup() {
    return new GroupProgressor(this);
  }

  title(title: ProgressMessage) {
    return new TitleProgressor(title, this);
  }

  subtitle(subtitle: ProgressMessage) {
    return new SubtitleProgressor(subtitle, this);
  }

  numeric(unit?: NumericProgressUnit | undefined, max?: number | undefined) {
    return new NumericProgressor(unit, max, this);
  }

  console(maxLineCount?: number) {
    return new ConsoleProgressor(maxLineCount, this);
  }
}

/** プログレスをフロントに反映するまでの最短の時間(ms) */
const SLEEP_TREATHOLD = 10;

export class WorldProgressor extends GroupProgressor {
  private id: WorldID;
  private hot = false;

  constructor(id: WorldID) {
    super();
    this.id = id;
  }

  protected update() {
    super.update();

    if (this.hot) return;

    this.hot = true;
    setTimeout(() => {
      this.hot = false;
      if (this.updated) {
        api.send.Progress(this.id, this.export());
      }
    }, SLEEP_TREATHOLD);

    api.send.Progress(this.id, this.export());
  }
}
