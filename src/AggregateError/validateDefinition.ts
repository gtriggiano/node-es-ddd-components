import assert from 'assert'
import { isObject } from 'lodash'

import { isValidName, validNameDescription } from '../utils/isValidName'

export default function validateDefinition(definition: any): void {
  assert(isObject(definition), `definition MUST be an object`)

  const { name } = definition

  assert(isValidName(name), `definition.name MUST be a ${validNameDescription}`)
}
