import { AggregateQueryDefinition } from '../../../lib'
import { Todo, TodoListState } from '../state'

const query: AggregateQueryDefinition<
  'getTodoByIdentity',
  TodoListState,
  string,
  Todo | undefined
> = {
  name: 'getTodoByIdentity',

  description: '',

  handler: (state, todoIdentity) =>
    state.todos.find(todo => todo.identity === todoIdentity),
}

export default query
