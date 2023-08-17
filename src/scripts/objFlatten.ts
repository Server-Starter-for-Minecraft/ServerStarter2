import { keys } from "./obj"

export function flattenObj<V extends (Record<string, V> | string)>(obj: Record<string, V>) {
  const flat = {} as Record<string, string>
  
  keys(obj).map(key => {
    const value = obj[key]
    if (typeof value === 'string') {
      flat[key] = value
    }
    else {
      const resultObj = flattenObj(value)
      keys(resultObj).map(k => {
        flat[`${key}.${k}`] = resultObj[k]
      })
    }
  })

  return flat
}