import { AggregateCommandDefinition, tuple } from '../../../lib'

import { Error } from '../errors'
import { Event } from '../events'
import { Query } from '../queries'
import { TodoListState } from '../state'

export interface Input {
  readonly name: string
}

const raisableErrors = tuple('TheListDoesNotExist')
type RaisableError = typeof raisableErrors[number]

const emittableEvents = tuple('ListNameChanged')
type EmittableEvent = typeof emittableEvents[number]

const CreateListCommand: AggregateCommandDefinition<
  'ChangeListName',
  Input,
  TodoListState,
  Query,
  Error,
  Event,
  RaisableError,
  EmittableEvent
> = {
  name: 'ChangeListName',

  description: 'Changes the TodoList name',

  raisableErrors,

  emittableEvents,

  // tslint:disable no-if-statement no-expression-statement
  handler: ({ name }, { query, error, emit }) => {
    if (!query.wasCreated()) {
      throw error.TheListDoesNotExist()
    }

    emit.ListNameChanged({ name })
  },
  // tslint:enable
}

export default CreateListCommand
