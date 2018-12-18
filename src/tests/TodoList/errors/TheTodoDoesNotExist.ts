import { CustomError } from '../../../lib'

export default CustomError<'TheTodoDoesNotExist'>({
  name: 'TheTodoDoesNotExist',
})
