export const errorMessageContentSyembol = Symbol();
export type ErrorMessageContentSyembol = typeof errorMessageContentSyembol;

export type MessageContent<
  T extends Record<string, any> | any[] | undefined = undefined
> = () => T;

type WithIndex<T extends any[]> = T extends [...infer U, infer V]
  ? [...WithIndex<U>, [U['length'], V]]
  : [];

type IndexedFunction<T extends [number, any][]> = {
  [K in keyof T]: (x: T[K][0]) => T[K][1];
}[number];

type WithIndexedFunction<T extends any[]> = IndexedFunction<WithIndex<T>>;

type WithNamedFunction<T extends Record<string, any>> = {
  [K in keyof T]: (x: K) => T[K];
}[keyof T];

export type MessageTranslationContent<T extends object | any[] | undefined> =
  T extends undefined
    ? () => string
    : T extends any[]
    ? (ctx: { list: UnionToIntersection<WithIndexedFunction<T>> }) => string
    : T extends Record<string, any>
    ? (ctx: { named: UnionToIntersection<WithNamedFunction<T>> }) => string
    : never;

export interface HierarchicalMessage {
  [K: string]: HierarchicalMessage | (() => object | any[] | undefined);
}

type AddSuffix<T, P extends string> = T extends [infer U, infer V]
  ? U extends string
    ? [`${P}.${U}`, V]
    : never
  : never;

type FlattenMessageKV<
  T extends Record<string, unknown>,
  Key = keyof T
> = Key extends string
  ? T[Key] extends Record<string, unknown>
    ? AddSuffix<FlattenMessageKV<T[Key]>, Key>
    : T[Key] extends () => infer R
    ? [`${Key}`, R]
    : never
  : never;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type TranslationPair<T> = T extends [infer K, infer V]
  ? K extends string
    ? V extends undefined
      ? { key: K }
      : { key: K; args: V }
    : never
  : never;

export type FlattenMessages<T extends HierarchicalMessage> = TranslationPair<
  FlattenMessageKV<T>
>;

export type MessageTranslation<T extends HierarchicalMessage> = {
  [K in keyof T]: T[K] extends MessageContent<infer U>
    ? string | MessageTranslationContent<U>
    : T[K] extends HierarchicalMessage
    ? MessageTranslation<T[K]>
    : never;
};

export type MessageDescTitleTranslation<T extends HierarchicalMessage> = {
  [K in keyof T]: T[K] extends MessageContent<infer U>
    ? {
        title: string | MessageTranslationContent<U>;
        desc?: string | MessageTranslationContent<U>;
      }
    : T[K] extends HierarchicalMessage
    ? MessageDescTitleTranslation<T[K]>
    : never;
};
