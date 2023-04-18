export type Func<A extends any[], R> = (..._: A) => R;
export type SendWindowToMain<A extends Func<any[], void>> = {
  type: 'SendWindowToMain';
  func: A;
};
export type SendMainToWindow<A extends Func<any[], void>> = {
  type: 'SendMainToWindow';
  func: A;
};
export type InvokerWindowToMain<A extends Func<any[], Promise<any>>> = {
  type: 'InvokerWindowToMain';
  func: A;
};
export type InvokeMainToWindow<A extends Func<any[], Promise<any>>> = {
  type: 'InvokeMainToWindow';
  func: A;
};
