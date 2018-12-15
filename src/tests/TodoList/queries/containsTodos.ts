import { AggregateQueryDefinition } from '../../../lib'
import { TodoListState } from '../state'

const query: AggregateQueryDefinition<
  'containsTodos',
  TodoListState,
  void,
  boolean
> = {
  name: 'containsTodos',

  description: 'Tells if the list contains todos',

  handler: state => !!state.todos.length,
}

export default query
