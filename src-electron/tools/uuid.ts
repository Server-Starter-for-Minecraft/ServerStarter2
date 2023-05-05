const crypto = require('crypto')
//export const uuid:string = crypto.randomUUID()

// export function genUUID():string{
//   const uuid:string = crypto.randomUUID()
//   return uuid
// }
/**UUIDの生成関数 */
export const genUUID = ():string=>crypto.randomUUID()