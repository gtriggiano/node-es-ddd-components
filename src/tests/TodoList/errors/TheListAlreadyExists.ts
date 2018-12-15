import { CustomError } from '../../../lib'

export default CustomError<'TheListAlreadyExists'>({
  name: 'TheListAlreadyExists',
})
