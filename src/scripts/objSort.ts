import { fromEntries, toEntries } from "./obj";

export function strSort(a: string, b: string) {
  if(a[0].toLowerCase() < b[0].toLowerCase()) return -1;
  else if(a[0].toLowerCase() > b[0].toLowerCase()) return 1;
  return 0;
}

export function sort<T>(obj: Record<string, T>) {
  const sortedEntries = toEntries(obj).sort((a, b) => strSort(a[0], b[0]))
  return fromEntries(sortedEntries)
}