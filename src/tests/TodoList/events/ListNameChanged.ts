import { DomainEvent } from '../../../lib'

import { TodoListState } from '../state'

export interface Payload {
  readonly name: string
}

export default DomainEvent<'ListNameChanged', TodoListState, Payload>({
  name: 'ListNameChanged',

  description: 'The TodoList name changed',

  reducer: (list, payload) => ({
    ...list,
    name: payload.name,
  }),
})
