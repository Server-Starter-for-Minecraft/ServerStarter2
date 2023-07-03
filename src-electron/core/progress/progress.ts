import {
  NumericProgress,
  PlainProgress,
  Progress,
  TranslationText,
} from '../../schema/progress';

type DeepPartial<T extends object> = {
  [K in keyof T]?: T extends Record<string, any> ? DeepPartial<T[K]> : K;
};

type ProgressorHandler<T extends Progress> = {
  update(value: DeepPartial<T>): void;
  end(): void;
};

abstract class Progressor<T extends Progress> {
  handler: ProgressorHandler<T>;
  protected _title?: TranslationText;
  protected _description?: TranslationText;
  protected _sub?: Record<string, Progress>;

  constructor(handler: ProgressorHandler<T>) {
    this.handler = handler;
  }

  update(value: DeepPartial<T>) {}
}

export class PlainProgressor extends Progressor<PlainProgress> {
  
}

export class NumericProgressor extends Progressor<NumericProgress> {
  constructor(handler: ProgressorHandler, option: NumericProgress) {
    super(handler, option);
    this.subs = {};
  }

  get value(): DeepPartial<NumericProgress> {
    return {
      type: 'numeric',
      title: this._title,
      description: this._description,
    };
  }
}
