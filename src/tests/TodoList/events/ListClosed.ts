import { DomainEvent } from '../../../lib'

import { TodoListState } from '../state'

export default DomainEvent<'ListClosed', TodoListState, object>({
  name: 'ListClosed',

  description: 'The TodoList has been closed',

  reducer: list => ({
    ...list,
    hasBeenClosed: true,
  }),
})
