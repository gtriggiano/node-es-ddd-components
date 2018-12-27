import { DomainEvent } from '../../../lib'

import { TodoListState } from '../state'

export interface Todo {
  readonly identity: string
}

export default DomainEvent<'TodoRemoved', TodoListState, Todo>({
  name: 'TodoRemoved',

  description: 'A todo was removed from the list',

  reducer: (list, { identity: identityOfTheRemovedTodo }) => ({
    ...list,
    todos: list.todos.filter(
      todo => todo.identity !== identityOfTheRemovedTodo
    ),
  }),
})
