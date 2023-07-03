import { genUUID } from 'app/src-electron/tools/uuid';
import {
  ConsoleProgress,
  NumericProgress,
  PlainProgress,
  Progress,
} from '../../schema/progress';

type ProgressorHandler<T extends Progress> = (value: T | null) => void;

abstract class IProgressor<T extends Progress> {
  handler: ProgressorHandler<T>;
  protected sub: Record<string, IProgressor<any>>;

  constructor(handler: ProgressorHandler<T>, options?: Omit<T, 'type'>) {
    this.handler = handler;
    this.sub = {};
    this.handler({ ...this.base(), ...(options ?? {}) });
  }

  protected abstract base(): T;

  /** keyだけをupdate */
  protected update<K extends keyof T>(key: K, value: T[K]) {
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

  end() {
    this.handler(null);
  }

  private subProgressor<T extends Progress, S extends IProgressor<T>>(
    gen: (handler: ProgressorHandler<T>) => S
  ): S {
    const id = genUUID();
    const update = (key: any, value: T[any]) => this.update(key, value);
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

  async withPlain<T>(
    action: (progress?: PlainProgressor) => Promise<T>,
    options?: Omit<PlainProgress, 'type'>
  ) {
    const sub = this.subPlain(options);
    const result = await action(sub);
    sub.end();
    return result;
  }

  subNumeric(options?: Omit<NumericProgress, 'type'>) {
    return this.subProgressor<NumericProgress, NumericProgressor>(
      (handler) => new NumericProgressor(handler, options)
    );
  }
}

export function genWithPlain(progress?: Progressor) {
  function withPlain<T>(
    action: (progress?: PlainProgressor) => Promise<T>,
    options?: Omit<PlainProgress, 'type'>
  ) {
    if (progress === undefined) return action();
    return progress?.withPlain((sub) => action(sub), options);
  }
  return withPlain;
}

export class PlainProgressor extends IProgressor<PlainProgress> {
  protected base(): PlainProgress {
    return { type: 'plain' };
  }
}

export class NumericProgressor extends IProgressor<NumericProgress> {
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

export class ConsoleProgressor extends IProgressor<ConsoleProgress> {
  protected base(): ConsoleProgress {
    return { type: 'console' };
  }
  set value(value: ConsoleProgress['value']) {
    this.update('value', value);
  }
}

export type Progressor =
  | PlainProgressor
  | NumericProgressor
  | ConsoleProgressor;
