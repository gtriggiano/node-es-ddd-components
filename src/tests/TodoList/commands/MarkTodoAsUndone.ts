import { AggregateCommandDefinition, tuple } from '../../../lib'

import { Error } from '../errors'
import { Event } from '../events'
import { Query } from '../queries'
import { TodoListState } from '../state'

export interface Input {
  readonly identity: string
}

const raisableErrors = tuple('TheListDoesNotExist', 'TheTodoDoesNotExist')
type RaisableError = typeof raisableErrors[number]

const emittableEvents = tuple('TodoRectifiedAsUncompleted')
type EmittableEvent = typeof emittableEvents[number]

const CreateListCommand: AggregateCommandDefinition<
  'MarkTodoAsUndone',
  Input,
  TodoListState,
  Query,
  Error,
  Event,
  RaisableError,
  EmittableEvent
> = {
  name: 'MarkTodoAsUndone',

  description: 'Marks a Todo as undone',

  raisableErrors,

  emittableEvents,

  // tslint:disable no-if-statement no-expression-statement
  handler: ({ identity }, { query, error, emit }) => {
    if (!query.wasCreated()) {
      throw error.TheListDoesNotExist()
    }

    const todo = query.getTodoByIdentity(identity)

    if (!todo) {
      throw error.TheTodoDoesNotExist()
    }

    if (!todo.done) return

    emit.TodoRectifiedAsUncompleted({ identity })
  },
  // tslint:enable
}

export default CreateListCommand
