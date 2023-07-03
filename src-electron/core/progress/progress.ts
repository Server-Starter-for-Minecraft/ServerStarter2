import { genUUID } from 'app/src-electron/tools/uuid';
import {
  ConsoleProgress,
  Deleted,
  NumericProgress,
  PlainProgress,
  Progress,
} from '../../schema/progress';

type ProgressorHandler<T extends Progress> = (value: T | Deleted) => void;

abstract class Progressor<T extends Progress> {
  handler: ProgressorHandler<T>;
  protected sub: Record<string, Progressor<any>>;

  constructor(handler: ProgressorHandler<T>, options?: Omit<T, 'type'>) {
    this.handler = handler;
    this.sub = {};
    this.handler({ ...this.base(), ...(options ?? {}) });
  }

  protected abstract base(): T;

  /** keyだけをupdate */
  update<K extends keyof T>(key: K, value: T[K]) {
    // TODO: 黒魔術の解消
    const partial: T = {
      ...this.base(),
      [key]: value,
    } as unknown as T;
    this.handler(partial);
  }

  set title(value: T['title']) {
    this.update('title', value);
  }

  set description(value: T['description']) {
    this.update('description', value);
  }

  private subProgressor<T extends Progress, S extends Progressor<T>>(
    gen: (handler: ProgressorHandler<T>) => S
  ): S {
    const id = genUUID();
    const update = this.update;
    const subHandler: ProgressorHandler<T> = (value) => {
      // TODO: あやしいas
      const sub: T['sub'] = { [id]: value } as T['sub'];
      update('sub', sub);
    };
    const result = gen(subHandler);
    this.sub[id] = result;
    return result;
  }

  subConsole(options?: Omit<ConsoleProgress, 'type'>) {
    return this.subProgressor<ConsoleProgress, ConsoleProgressor>(
      (handler) => new ConsoleProgressor(handler, options)
    );
  }

  subPlain(options?: Omit<PlainProgress, 'type'>) {
    return this.subProgressor<PlainProgress, PlainProgressor>(
      (handler) => new PlainProgressor(handler, options)
    );
  }

  subNumeric(options?: Omit<NumericProgress, 'type'>) {
    return this.subProgressor<NumericProgress, NumericProgressor>(
      (handler) => new NumericProgressor(handler, options)
    );
  }
}

export class PlainProgressor extends Progressor<PlainProgress> {
  protected base(): PlainProgress {
    return { type: 'plain' };
  }
}

export class NumericProgressor extends Progressor<NumericProgress> {
  protected base(): NumericProgress {
    return { type: 'numeric' };
  }
  set value(value: NumericProgress['value']) {
    this.update('value', value);
  }

  set max(value: NumericProgress['max']) {
    this.update('max', value);
  }
}

export class ConsoleProgressor extends Progressor<ConsoleProgress> {
  protected base(): ConsoleProgress {
    return { type: 'console' };
  }
  set value(value: ConsoleProgress['value']) {
    this.update('value', value);
  }
}
