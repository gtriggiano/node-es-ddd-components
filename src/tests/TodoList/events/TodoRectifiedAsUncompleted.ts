import { DomainEvent } from '../../../lib'

import { TodoListState } from '../state'

export interface Todo {
  readonly identity: string
}

export default DomainEvent<'TodoRectifiedAsUncompleted', TodoListState, Todo>({
  name: 'TodoRectifiedAsUncompleted',

  description: 'A todo was marked as uncompleted',

  reducer: (list, { payload: { identity: identityOfUncompletedTodo } }) => ({
    ...list,
    todos: list.todos.map(todo =>
      todo.identity !== identityOfUncompletedTodo
        ? todo
        : {
            ...todo,
            done: false,
          }
    ),
  }),
})
