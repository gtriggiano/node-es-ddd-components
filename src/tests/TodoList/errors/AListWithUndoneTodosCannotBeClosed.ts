import { CustomError } from '../../../lib'

export interface ErrorData {
  readonly totalUndoneTodos: number
}

export default CustomError<'AListWithUndoneTodosCannotBeClosed', ErrorData>({
  name: 'AListWithUndoneTodosCannotBeClosed',
})
