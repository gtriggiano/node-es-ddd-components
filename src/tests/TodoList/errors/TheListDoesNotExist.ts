import { CustomError } from '../../../lib'

export default CustomError<'TheListDoesNotExist'>({
  name: 'TheListDoesNotExist',
})
