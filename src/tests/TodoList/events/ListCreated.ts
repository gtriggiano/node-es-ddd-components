import { DomainEvent } from '../../../lib'

import { TodoListState } from '../state'

export interface Payload {
  readonly identity: string
  readonly name: string
}

export default DomainEvent<'ListCreated', TodoListState, Payload>({
  name: 'ListCreated',

  description: 'A new TodoList has been created',

  reducer: (list, payload) => ({
    ...list,
    identity: payload.identity,
    name: payload.name,
  }),
})
