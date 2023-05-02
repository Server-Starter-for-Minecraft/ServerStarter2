export type StringValidator = {
  type: 'string';
  default: string;
};

export type NumberValidator = {
  type: 'number';
  default: number;
};

export type BooleanValidator = {
  type: 'boolean';
  default: boolean;
};

export type NullValidator = {
  type: 'null';
};

export type ArrayValidator<T extends Validator> = {
  type: 'array';
  array: T;
  default?: Array<Varlidant<T>>;
};

export type TupleValidator<T extends Validator[]> = {
  type: 'tuple';
  tuple: T;
  default: TupleVarlidant<T>;
};

export type RecordValidator<T extends Validator> = {
  type: 'record';
  record: T;
  default?: Record<string, Varlidant<T>>;
};

export type ObjectValidator = {
  type: 'object';
  object: {
    [key in string]: Validator;
  };
};

export type Validator =
  | StringValidator
  | NumberValidator
  | BooleanValidator
  | NullValidator
  | ArrayValidator<any>
  | TupleValidator<any>
  | RecordValidator<any>
  | ObjectValidator;

type Varlidant<T extends Validator> = T['type'] extends StringValidator
  ? string
  : T['type'] extends NumberValidator
  ? number
  : T['type'] extends BooleanValidator
  ? boolean
  : T['type'] extends NullValidator
  ? null
  : T extends ArrayValidator<any>
  ? Varlidant<T['array']>[]
  : T extends TupleValidator<any>
  ? TupleVarlidant<T['tuple']>
  : T extends RecordValidator<any>
  ? Record<string, T['record']>
  : T extends ObjectValidator
  ? ObjectVarlidant<T['object']>
  : never;

type TupleVarlidant<T extends Validator[]> = {
  [K in keyof T]: Varlidant<T[K]>;
};

type ObjectVarlidant<T extends { [K in string]: Validator }> = {
  [K in keyof T]: Varlidant<T[K]>;
};

export function validateJson<T extends Validator>(
  validator: T,
  value: any
): Varlidant<T> {
  switch (validator.type) {
    case 'string':
      if (typeof value === 'string') return value as Varlidant<T>;
      else return validator.default as Varlidant<T>;

    case 'number':
      if (typeof value === 'number') return value as Varlidant<T>;
      else return validator.default as Varlidant<T>;

    case 'boolean':
      if (typeof value === 'boolean') return value as Varlidant<T>;
      else return validator.default as Varlidant<T>;

    case 'null':
      return null as Varlidant<T>;

    case 'array':
      if (value instanceof Array) {
        const result = [];
        for (const v of value) {
          const r = validateJson(validator.array, v) as Varlidant<T>; // TODO: これ嘘
          result.push(r);
        }
        return result as Varlidant<T>;
      }
      return (validator.default ?? []) as Varlidant<T>;

    case 'tuple':
      if (value instanceof Array) {
        const result = [];
        for (const v of value) {
          const r = validateJson(validator.tuple, v) as Varlidant<T>; // TODO: これ嘘
          result.push(r);
        }
        return result as Varlidant<T>;
      }
      return validator.default as Varlidant<T>;

    case 'record':
      if (typeof value === 'object') {
        let success = true;
        const result: any = {};
        for (const e of Object.entries(value)) {
          const [k, v] = e;
          const r = validateJson(validator.record, v);
          result[k] = r;
        }
        if (success) return result;
      }
      return (validator.default ?? {}) as Varlidant<T>;

    case 'object':
      if (typeof value !== 'object') value = {};
      const result: any = {};
      for (const e of Object.entries(validator.object)) {
        const [k, v] = e;
        const r = validateJson(v, value[k]);
        result[k] = r;
      }
      return result;
  }
}
