/**
 * 名前群に追加しようとしている名前がすでに使用されている場合，連番を付けた新しい名前を返す
 *
 * 追加する名前が未使用の場合は無加工の名前を返す
 *
 * ```
 * names=['NewName', 'HelloWorld']
 * targetName='NewName'
 * console.log(createNewName(names, targetName))
 * // -> 'NewName_2'
 *
 * targetName='TestName'
 * console.log(createNewName(names, targetName))
 * // -> 'TestName'
 * ```
 */
export function createNewName(names: string[], targetName: string) {
  let _targetName = targetName;
  let idx = 1;

  while (names.includes(_targetName)) {
    _targetName = `${targetName}_${idx}`;
    idx++;
  }

  return _targetName;
}

/** In Source Testing */
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('createNewName', () => {
    const names = ['NewName', 'HelloWorld'];
    expect(createNewName(names, 'NewName')).toEqual('NewName_1');
    expect(createNewName(names, 'TestName')).toEqual('TestName');
    const names2 = ['NewName', 'NewName_1', 'HelloWorld'];
    expect(createNewName(names2, 'NewName')).toEqual('NewName_2');
  });
}
