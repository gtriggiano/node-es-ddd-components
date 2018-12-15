import { isString } from 'lodash'

export function isValidName(x: any): boolean {
  return isString(x) && /^[a-zA-Z]([a-zA-Z0-9]).*?/.test(x)
}

export const validNameDescription = `string starting with a letter and composed by letters and digits only`
