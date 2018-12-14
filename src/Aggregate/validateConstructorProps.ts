import assert from 'assert'
import { isInteger, isObject, isString } from 'lodash'

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
    `'snapshot' MUST be either nil or a {version: number, state: string} compatible object`
  )
  assert(
    Array.isArray(events) && areAllValidDomainEvents(events),
    `'events' MUST be either nil or an array of [DomainEvent | null]`
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

export function areAllValidDomainEvents(events: ReadonlyArray<any>): boolean {
  return events.reduce(
    (allValid, event) => allValid && isValidDomainEvent(event),
    true
  )
}

export function isValidDomainEvent(event: any): boolean {
  return !!event && isString(event.name) && isString(event.data)
}
