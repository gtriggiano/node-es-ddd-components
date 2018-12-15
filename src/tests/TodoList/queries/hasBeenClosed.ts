import { AggregateQueryDefinition } from '../../../lib'
import { TodoListState } from '../state'

const query: AggregateQueryDefinition<
  'hasBeenClosed',
  TodoListState,
  void,
  boolean
> = {
  name: 'hasBeenClosed',

  description: 'Tells if the TodoList has been closed',

  handler: state => !!state.hasBeenClosed,
}

export default query
