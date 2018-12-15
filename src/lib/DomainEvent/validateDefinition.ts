import assert from 'assert'
import { isFunction, isNil, isObject, isString } from 'lodash'

import { isValidName, validNameDescription } from '../utils'

export default function validateDefinition(definition: any): void {
  assert(isObject(definition), `definition MUST be an object`)

  const {
    name,
    description,
    reducer,
    serializePayload,
    deserializePayload,
  } = definition

  assert(isValidName(name), `definition.name MUST be a ${validNameDescription}`)
  assert(
    isNil(description) || isString(description),
    `definition.description MUST be nil or a string`
  )
  assert(isFunction(reducer), `definition.reducer MUST be a function`)
  assert(
    isNil(serializePayload) || isFunction(serializePayload),
    `definition.serializePayload MUST be either nil or a function`
  )
  assert(
    isNil(deserializePayload) || isFunction(deserializePayload),
    `definition.deserializePayload MUST be either nil or a function`
  )
}
