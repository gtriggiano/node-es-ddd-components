import { AggregateCommandDefinition, tuple } from '../../../lib'

import { Error } from '../errors'
import { Event } from '../events'
import { Query } from '../queries'
import { TodoListState } from '../state'

export interface Input {
  readonly identity: string
}

const raisableErrors = tuple(
  'ATodoCannotBeRemovedFromAClosedList',
  'TheListDoesNotExist'
)
type RaisableError = typeof raisableErrors[number]

const emittableEvents = tuple('TodoRemoved')
type EmittableEvent = typeof emittableEvents[number]

const CreateListCommand: AggregateCommandDefinition<
  'RemoveTodo',
  Input,
  TodoListState,
  Query,
  Error,
  Event,
  RaisableError,
  EmittableEvent
> = {
  name: 'RemoveTodo',

  description: 'Removes a Todo from the TodoList',

  raisableErrors,

  emittableEvents,

  // tslint:disable no-if-statement no-expression-statement
  handler: ({ identity }, { query, error, emit }) => {
    if (!query.wasCreated()) {
      throw error.TheListDoesNotExist()
    }

    if (query.hasBeenClosed()) {
      throw error.ATodoCannotBeRemovedFromAClosedList()
    }

    const todo = query.getTodoByIdentity(identity)

    if (!todo) return

    emit.TodoRemoved({ identity })
  },
  // tslint:enable
}

export default CreateListCommand
