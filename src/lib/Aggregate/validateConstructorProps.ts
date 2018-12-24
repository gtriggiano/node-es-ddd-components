import assert from 'assert'
import { isInteger, isObject, isString } from 'lodash'

import { isValidName } from '../utils'

interface ConstructorProps {
  readonly events: any
  readonly identity: any
  readonly isSingleton: boolean
  readonly snapshot: any
}

export default function validateConstructorProps({
  events,
  identity,
  isSingleton,
  snapshot,
}: ConstructorProps): void {
  assert(
    (isSingleton && !identity) || (!isSingleton && isValidIdentity(identity)),
    isSingleton
      ? `'identity' should be undefined in a singleton aggregate`
      : `'identity' MUST be a non empty string in a non singleton aggregate`
  )
  assert(
    !snapshot || isValidSnapshot(snapshot),
    `'snapshot' MUST be either nil or a {version: number, serializedState: string} compatible object. Received ${JSON.stringify(
      snapshot
    )}`
  )
  assert(
    Array.isArray(events) && areAllValidSerializedDomainEvents(events),
    `'events' MUST be either nil or an array of serialized domain events {name: string, serializedPayload: string}`
  )
}

export function isValidIdentity(str: any): boolean {
  return isString(str) && !!str
}

export function isValidSnapshot(snapshot: any): boolean {
  return (
    isObject(snapshot) &&
    isInteger(snapshot.version) &&
    snapshot.version > 0 &&
    isString(snapshot.serializedState)
  )
}

export function areAllValidSerializedDomainEvents(
  events: ReadonlyArray<any>
): boolean {
  return events.reduce(
    (allValid, event) => allValid && isValidSerializedDomainEvent(event),
    true
  )
}

export function isValidSerializedDomainEvent(event: any): boolean {
  return isObject(event) && isValidName(event.name) && isString(event.payload)
}
