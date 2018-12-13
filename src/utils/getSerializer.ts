import { AggregateError } from '../AggregateError'

interface ErrorData {
  readonly originalError: Error
}

export const SerializationError = AggregateError<
  'SerializationError',
  ErrorData
>({
  name: 'SerializationError',
})

export type Serializer<T> = (t: T) => string

export function getSerializer<T>(
  serializer?: Serializer<T>,
  errorMessage?: string
): Serializer<T> {
  const serialize = serializer || JSON.stringify
  return (t: T) => {
    try {
      return serialize(t)
    } catch (e) {
      throw SerializationError(errorMessage || e.message, { originalError: e })
    }
  }
}
