import { tuple } from '../../../lib'

import allTodosAreCompleted from './allTodosAreCompleted'
import containsTodos from './containsTodos'
import getTodoByIdentity from './getTodoByIdentity'
import getTodosByState from './getTodosByState'
import hasBeenClosed from './hasBeenClosed'
import wasCreated from './wasCreated'

const queries = tuple(
  allTodosAreCompleted,
  getTodoByIdentity,
  getTodosByState,
  hasBeenClosed,
  containsTodos,
  wasCreated
)

export default queries
export type Query = typeof queries[number]
