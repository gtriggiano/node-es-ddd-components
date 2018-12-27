import 'jest'
import { noop } from 'lodash'

import {
  BadDomainEventDefinition,
  DomainEvent,
} from '../../../../dist/main/lib'

const definition = {
  name: 'SomethingHappened',
  description: 'A description',
  reducer: noop,
  serializeData: noop,
  deserializeData: noop,
}

describe('Domain event definition validation. DomainEvent(definition) throws `BadDomainEventDefinition` when:', () => {
  it('definition is not an object', () => {
    expect(() => DomainEvent(noop)).toThrow(BadDomainEventDefinition)
    expect(() => DomainEvent(2)).toThrow(BadDomainEventDefinition)
    expect(() => DomainEvent('aaaa')).toThrow(BadDomainEventDefinition)
    expect(() => DomainEvent(definition)).not.toThrow()
  })
  it('definition.name is not a valid name', () => {
    expect(() => DomainEvent({ ...definition, name: true })).toThrow(
      BadDomainEventDefinition
    )
    expect(() => DomainEvent({ ...definition, name: undefined })).toThrow(
      BadDomainEventDefinition
    )
    expect(() => DomainEvent({ ...definition, name: '1' })).toThrow(
      BadDomainEventDefinition
    )
  })
  it('definition.description is neither nnil nor a string', () => {
    expect(() => DomainEvent({ ...definition, description: 2 })).toThrow(
      BadDomainEventDefinition
    )
    expect(() => DomainEvent({ ...definition, description: true })).toThrow(
      BadDomainEventDefinition
    )
    expect(() => DomainEvent({ ...definition, description: [] })).toThrow(
      BadDomainEventDefinition
    )
  })
  it('definition.reducer is not a function', () => {
    expect(() => DomainEvent({ ...definition, reducer: undefined })).toThrow(
      BadDomainEventDefinition
    )
  })
  it('definition.serializePayload is neither nil nor a function', () => {
    expect(() => DomainEvent({ ...definition, serializePayload: '' })).toThrow(
      BadDomainEventDefinition
    )
    expect(() => DomainEvent({ ...definition, serializePayload: 3 })).toThrow(
      BadDomainEventDefinition
    )
    expect(() =>
      DomainEvent({ ...definition, serializePayload: undefined })
    ).not.toThrow()
  })
  it('definition.deserializePayload is neither nil nor a function', () => {
    expect(() =>
      DomainEvent({ ...definition, deserializePayload: '' })
    ).toThrow(BadDomainEventDefinition)
    expect(() => DomainEvent({ ...definition, deserializePayload: 3 })).toThrow(
      BadDomainEventDefinition
    )
    expect(() =>
      DomainEvent({ ...definition, deserializePayload: undefined })
    ).not.toThrow()
  })
})
