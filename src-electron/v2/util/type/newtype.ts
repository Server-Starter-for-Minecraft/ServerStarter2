const NEWTYPE = Symbol();

/**
 * 既存の型<T>の中で役割を限定した型をつくる
 *
 * NewType型へのキャストは as を使わないと不可能なので、
 * インスタンス作成メソッドは限られた範囲に閉じておくこと
 *
 * ```ts
 * type Name = NewType<string,'Name'> // 実行時にはただのstringになる
 *
 * function greet(name:Name):void{
 *   console.log(`hello ${name} !`)
 * }
 *
 * greet('apple') // TypeError: 'apple' is not Name
 *
 * function getName(name:string):Name{
 *   return name as Name
 * }
 *
 * greet(getName('taro')) // Valid
 * ```
 */
export type NewType<T, D extends string> = T extends {
  [NEWTYPE]: [infer R, infer N];
}
  ? R & {
      [NEWTYPE]: [R, D | N];
    }
  : T & {
      [NEWTYPE]: [T, D];
    };
