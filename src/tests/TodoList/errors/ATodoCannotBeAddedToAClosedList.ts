import { CustomError } from '../../../lib'

export default CustomError<'ATodoCannotBeAddedToAClosedList'>({
  name: 'ATodoCannotBeAddedToAClosedList',
})
