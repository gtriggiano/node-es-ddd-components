import { AggregateCommandDefinition, tuple } from '../../../lib'

import { Error } from '../errors'
import { Event } from '../events'
import { Query } from '../queries'
import { TodoListState } from '../state'

const raisableErrors = tuple(
  'AListWithUndoneTodosCannotBeClosed',
  'TheListDoesNotExist'
)
type RaisableError = typeof raisableErrors[number]

const emittableEvents = tuple('ListClosed')
type EmittableEvent = typeof emittableEvents[number]

const CreateListCommand: AggregateCommandDefinition<
  'CloseList',
  void,
  TodoListState,
  Query,
  Error,
  Event,
  RaisableError,
  EmittableEvent
> = {
  name: 'CloseList',

  description: 'Closes a TodoList',

  raisableErrors,

  emittableEvents,

  // tslint:disable no-if-statement no-expression-statement
  handler: (_, { query, error, emit }) => {
    if (!query.wasCreated()) {
      throw error.TheListDoesNotExist()
    }

    const totalUndoneTodos = query.getTodosByState('undone').length
    if (totalUndoneTodos) {
      throw error.AListWithUndoneTodosCannotBeClosed(undefined, {
        totalUndoneTodos,
      })
    }

    emit.ListClosed({})
  },
  // tslint:enable
}

export default CreateListCommand
