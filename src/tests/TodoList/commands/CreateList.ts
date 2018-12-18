import { AggregateCommandDefinition, tuple } from '../../../lib'

import { Error } from '../errors'
import { Event } from '../events'
import { Query } from '../queries'
import { TodoListState } from '../state'

export interface Input {
  readonly identity: string
  readonly name: string
}

const raisableErrors = tuple('TheListAlreadyExists')
type RaisableError = typeof raisableErrors[number]

const emittableEvents = tuple('ListCreated')
type EmittableEvent = typeof emittableEvents[number]

const CreateListCommand: AggregateCommandDefinition<
  'CreateList',
  Input,
  TodoListState,
  Query,
  Error,
  Event,
  RaisableError,
  EmittableEvent
> = {
  name: 'CreateList',

  description: 'Creates a new TodoList',

  raisableErrors,

  emittableEvents,

  // tslint:disable no-if-statement no-expression-statement
  handler: ({ identity, name }, { query, error, emit }) => {
    if (query.wasCreated()) {
      throw error.TheListAlreadyExists()
    }

    emit.ListCreated({ identity, name })
  },
  // tslint:enable
}

export default CreateListCommand
