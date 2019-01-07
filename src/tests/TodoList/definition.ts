import { AggregateDefinition } from '../../lib'

import commands, { Command } from './commands'
import errors, { Error } from './errors'
import events, { Event } from './events'
import queries, { Query } from './queries'
import { initialState, TodoListState } from './state'

export const definition: AggregateDefinition<
  'TodosManagement',
  'TodoList',
  false,
  TodoListState,
  Query,
  Error,
  Event,
  Command
> = {
  context: 'TodosManagement',
  type: 'TodoList',

  initialState,

  singleton: false,

  commands,
  errors,
  events,
  queries,
}
