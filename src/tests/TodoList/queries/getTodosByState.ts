import { AggregateQueryDefinition } from '../../../lib'
import { Todo, TodoListState } from '../state'

const query: AggregateQueryDefinition<
  'getTodosByState',
  TodoListState,
  'all' | 'done' | 'undone',
  ReadonlyArray<Todo>
> = {
  name: 'getTodosByState',

  description: '',

  handler: (state, filter) => {
    switch (filter) {
      case 'all':
        return state.todos
      case 'done':
        return state.todos.filter(todo => todo.done)
      case 'undone':
        return state.todos.filter(todo => !todo.done)
    }
  },
}

export default query
