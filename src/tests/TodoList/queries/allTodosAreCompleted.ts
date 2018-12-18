import { AggregateQueryDefinition } from '../../../lib'
import { TodoListState } from '../state'

const query: AggregateQueryDefinition<
  'allTodosAreCompleted',
  TodoListState,
  void,
  boolean
> = {
  name: 'allTodosAreCompleted',

  description: '',

  handler: state =>
    state.todos.filter(todo => todo.done).length === state.todos.length,
}

export default query
