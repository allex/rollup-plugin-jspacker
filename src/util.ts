export const isObject = <T> (o: T) => o && typeof o === 'object'
export const isArray = Array.isArray
export const isPromise = (o: any) => o && typeof o.then === 'function'

export const merge = <T extends object = object> (r: T, ...objects: T[]): T {
  return objects.reduce((p, o) => {
    Object.keys(o).forEach(key => {
      const pVal = p[key]
      const oVal = o[key]
      if (isArray(pVal) && isArray(oVal)) {
        p[key] = pVal.concat(...oVal)
      } else if (isObject(pVal) && isObject(oVal)) {
        p[key] = merge(pVal, oVal)
      } else {
        p[key] = oVal
      }
    })
    return p
  }, r || {})
}
