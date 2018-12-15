import { AggregateQueryDefinition } from '../../../lib'
import { TodoListState } from '../state'

const query: AggregateQueryDefinition<
  'wasCreated',
  TodoListState,
  void,
  boolean
> = {
  name: 'wasCreated',

  description: 'Tells if the TodoList has already been created',

  handler: state => !!state.identity,
}

export default query
