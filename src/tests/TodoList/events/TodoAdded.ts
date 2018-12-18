import { DomainEvent } from '../../../lib'

import { TodoListState } from '../state'

export interface Payload {
  readonly identity: string
  readonly text: string
}

export default DomainEvent<'TodoAdded', TodoListState, Payload>({
  name: 'TodoAdded',

  description: 'The TodoList name changed',

  reducer: (list, event) => ({
    ...list,
    todos: [
      ...list.todos,
      {
        ...event.payload,
        done: false,
      },
    ],
  }),
})
