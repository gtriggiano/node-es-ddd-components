import { DomainEvent } from '../../../lib'

import { TodoListState } from '../state'

export interface Payload {
  readonly identity: string
}

export default DomainEvent<'TodoCompleted', TodoListState, Payload>({
  name: 'TodoCompleted',

  description: 'A todo was completed',

  reducer: (list, { data: { identity: identityOfCompletedTodo } }) => ({
    ...list,
    todos: list.todos.map(todo =>
      todo.identity !== identityOfCompletedTodo
        ? todo
        : {
            ...todo,
            done: true,
          }
    ),
  }),
})
