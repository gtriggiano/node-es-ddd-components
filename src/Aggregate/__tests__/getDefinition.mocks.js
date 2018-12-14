const { isEqual } = require('lodash')

const { DomainEvent, AggregateError } = require('../../../dist/main')

const INITIAL_STATE = {
  created: false,
  name: null,
  address: null,
}
const wasCreatedQuery = {
  name: 'wasCreated',
  handler: state => !!state.created,
}
const getNameQuery = {
  name: 'getName',
  description: '',
  handler: state => state.name,
}
const getAddressQuery = {
  name: 'getAddress',
  handler: state => state.address,
}
const CreatedEvent = DomainEvent({
  name: 'Created',
  reducer: (state, event) => ({
    ...state,
    created: true,
    name: event.data.name,
  }),
})
const RenamedEvent = DomainEvent({
  name: 'Renamed',
  reducer: (state, event) => ({
    ...state,
    name: event.data.name,
  }),
})
const DeclaredAddressEvent = DomainEvent({
  name: 'DeclaredAddress',
  reducer: (state, event) => ({
    ...state,
    address: event.data.address,
  }),
})
const MovedEvent = DomainEvent({
  name: 'Moved',
  reducer: (state, event) => ({
    ...state,
    address: event.data.address,
  }),
})
const UserAlreadyExist = AggregateError({
  name: 'UserAlreadyExist',
})
const UserDoesNotExist = AggregateError({
  name: 'UserDoesNotExist',
})
const CreateCommand = {
  name: 'Create',
  emittableEvents: ['Created'],
  raisableErrors: ['UserAlreadyExist'],
  handler: ({ name }, { query, emit, error }) => {
    if (query.wasCreated()) {
      throw error.UserAlreadyExist()
    }
    emit.Created({ name })
  },
}
const RenameCommand = {
  name: 'Rename',
  description: '',
  emittableEvents: ['Renamed'],
  raisableErrors: ['UserDoesNotExist'],
  handler: ({ name }, { query, emit, error }) => {
    if (!query.wasCreated()) {
      throw new error.UserDoesNotExist()
    }
    if (query.getName() === name) return
    emit.Renamed({ name })
  },
}
const SetAddressCommand = {
  name: 'SetAddress',
  emittableEvents: ['DeclaredAddress', 'Moved'],
  raisableErrors: ['UserDoesNotExist'],
  handler: ({ address }, { query, emit, error }) => {
    if (!query.wasCreated()) {
      throw new error.UserDoesNotExist()
    }

    const actualAddress = query.getAddress()
    if (isEqual(address, actualAddress)) return

    if (actualAddress) {
      emit.Moved({ address })
    } else {
      emit.DeclaredAddress({ address })
    }
  },
}

const getDefinition = () => ({
  description: 'An User',
  context: 'UsersManagement',
  type: 'User',
  singleton: false,
  initialState: INITIAL_STATE,
  commands: [CreateCommand, RenameCommand, SetAddressCommand],
  queries: [wasCreatedQuery, getNameQuery, getAddressQuery],
  events: [CreatedEvent, RenamedEvent, DeclaredAddressEvent, MovedEvent],
  errors: [UserAlreadyExist, UserDoesNotExist],
})

module.exports = {
  INITIAL_STATE,
  wasCreatedQuery,
  getNameQuery,
  getAddressQuery,
  CreatedEvent,
  RenamedEvent,
  DeclaredAddressEvent,
  MovedEvent,
  UserAlreadyExist,
  UserDoesNotExist,
  CreateCommand,
  RenameCommand,
  SetAddressCommand,
  getDefinition,
}
