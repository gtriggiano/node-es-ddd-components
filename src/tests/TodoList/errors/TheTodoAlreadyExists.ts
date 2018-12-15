import { CustomError } from '../../../lib'

export default CustomError<'TheTodoAlreadyExists'>({
  name: 'TheTodoAlreadyExists',
})
