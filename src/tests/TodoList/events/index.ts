import { tuple } from '../../../lib'

import ListClosed from './ListClosed'
import ListCreated from './ListCreated'
import ListNameChanged from './ListNameChanged'
import TodoAdded from './TodoAdded'
import TodoCompleted from './TodoCompleted'
import TodoRectifiedAsUncompleted from './TodoRectifiedAsUncompleted'
import TodoRemoved from './TodoRemoved'

const events = tuple(
  ListClosed,
  ListCreated,
  ListNameChanged,
  TodoAdded,
  TodoCompleted,
  TodoRectifiedAsUncompleted,
  TodoRemoved
)

export default events
export type Event = typeof events[number]
