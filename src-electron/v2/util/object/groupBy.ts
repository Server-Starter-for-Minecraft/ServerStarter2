export function groupBy<K extends string, V>(
  objects: V[],
  keySelector: (item: V) => K
): Record<K, V[]> {
  const result = {} as Record<K, V[]>;
  objects.forEach((obj) => {
    const k = keySelector(obj);
    if (result[k]) result[k].push(obj);
    else result[k] = [obj];
  });
  return result;
}
