import { AggregateCommandDefinition, tuple } from '../../../lib'

import { Error } from '../errors'
import { Event } from '../events'
import { Query } from '../queries'
import { TodoListState } from '../state'

export interface Input {
  readonly identity: string
  readonly text: string
}

const raisableErrors = tuple(
  'ATodoCannotBeAddedToAClosedList',
  'TheListDoesNotExist',
  'TheTodoAlreadyExists'
)
type RaisableError = typeof raisableErrors[number]

const emittableEvents = tuple('TodoAdded')
type EmittableEvent = typeof emittableEvents[number]

const CreateListCommand: AggregateCommandDefinition<
  'AddTodo',
  Input,
  TodoListState,
  Query,
  Error,
  Event,
  RaisableError,
  EmittableEvent
> = {
  name: 'AddTodo',

  description: 'Adds a Todo to the TodoList',

  raisableErrors,

  emittableEvents,

  // tslint:disable no-if-statement no-expression-statement
  handler: ({ identity, text }, { query, error, emit }) => {
    if (!query.wasCreated()) {
      throw error.TheListDoesNotExist()
    }

    if (query.hasBeenClosed()) {
      throw error.ATodoCannotBeAddedToAClosedList()
    }

    if (query.getTodoByIdentity(identity)) {
      throw error.TheTodoAlreadyExists()
    }

    emit.TodoAdded({ identity, text })
  },
  // tslint:enable
}

export default CreateListCommand
