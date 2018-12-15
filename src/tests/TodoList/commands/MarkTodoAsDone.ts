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

const emittableEvents = tuple('TodoCompleted')
type EmittableEvent = typeof emittableEvents[number]

const CreateListCommand: AggregateCommandDefinition<
  'MarkTodoAsDone',
  Input,
  TodoListState,
  Query,
  Error,
  Event,
  RaisableError,
  EmittableEvent
> = {
  name: 'MarkTodoAsDone',

  description: 'Marks a Todo as done',

  raisableErrors,

  emittableEvents,

  // tslint:disable no-if-statement no-expression-statement
  handler: ({ identity }, { query, error, emit }) => {
    if (!query.wasCreated()) {
      throw error.TheListDoesNotExist()
    }

    const todo = query.getTodosByState('all').find(t => t.identity === identity)

    if (!todo) {
      throw error.TheTodoDoesNotExist()
    }

    if (todo.done) return

    emit.TodoCompleted({ identity })
  },
  // tslint:enable
}

export default CreateListCommand
