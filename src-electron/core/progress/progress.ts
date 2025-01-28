import { UUID } from 'app/src-electron/schema/brands';
import { ProgressMessage } from 'app/src-electron/schema/progressMessage';
import { WorldID } from 'app/src-electron/schema/world';
import { genUUID } from 'app/src-electron/util/random/uuid';
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

export abstract class Progressor<T extends Progress> {
  parent?: GroupProgressor;
  uuid: UUID;

  constructor(parent?: GroupProgressor) {
    this.parent = parent;
    this.uuid = UUID.parse(genUUID());
  }

  protected update() {
    // 変更を通知
    this.parent?.update();
  }

  delete() {
    if (this.parent) {
      this.parent.subs = this.parent.subs.filter((x) => x.uuid !== this.uuid);
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
    this.setSubtitle(val);
  }

  setSubtitle(val: ProgressMessage) {
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
  private _unit: NumericProgressUnit;

  constructor(
    unit: NumericProgressUnit,
    max?: number,
    parent?: GroupProgressor
  ) {
    super(parent);
    this._unit = unit;
    this._max = max;
    this.update();
  }

  set value(value: number) {
    this.setValue(value);
  }

  setValue(value: number) {
    this._value = value;
    this.update();
  }

  set max(value: number) {
    this.setMax(value);
  }

  setMax(value: number) {
    this._max = value;
    this.update();
  }

  set unit(value: NumericProgressUnit) {
    this.setUnit(value);
  }

  setUnit(value: NumericProgressUnit) {
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
  private _console: string;

  /** maxLineCount : コンソールに保存する最大行数 */
  constructor(parent?: GroupProgressor) {
    super(parent);
    this._console = '';
    this.update();
  }

  push(chunk: string) {
    if (chunk.trim() === '') return;
    this._console = chunk;
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

  private push<T extends Progressor<any>>(sub: T): T {
    this.subs.push(sub);
    return sub;
  }

  subGroup() {
    return this.push(new GroupProgressor(this));
  }

  title(title: ProgressMessage) {
    return this.push(new TitleProgressor(title, this));
  }

  subtitle(subtitle: ProgressMessage) {
    return this.push(new SubtitleProgressor(subtitle, this));
  }

  numeric(unit: NumericProgressUnit, max?: number | undefined) {
    return this.push(new NumericProgressor(unit, max, this));
  }

  console() {
    return this.push(new ConsoleProgressor(this));
  }
}

/** プログレスをフロントに反映するまでの最短の時間(ms) */
const SLEEP_TREATHOLD = 100;

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
      api.send.Progress(this.id, this.export());
    }, SLEEP_TREATHOLD);

    api.send.Progress(this.id, this.export());
  }
}
