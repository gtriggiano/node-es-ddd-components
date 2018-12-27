import 'jest'
import { sample } from 'lodash'

import {
  Aggregate,
  CustomError,
  DomainEvent,
  STRICT_CONSISTENCY_POLICY,
  SOFT_CONSISTENCY_POLICY,
  NO_CONSISTENCY_POLICY,
} from 'lib-export'

import { definition } from 'lib-tests/TodoList'

describe('The CommandHandlerInterface object', () => {
  describe('interface.query', () => {
    it('=== aggregate.query', () => {
      const DoThisCommand = {
        name: 'DoThis',
        raisableErrors: [],
        emittableEvents: [],
        handler: jest.fn(() => {}),
      }
      const AggregateType = Aggregate({
        ...definition,
        commands: [DoThisCommand],
      })
      const aggregate = AggregateType('x')
      aggregate.execute.DoThis({})

      expect(DoThisCommand.handler).toHaveBeenCalledTimes(1)
      expect(DoThisCommand.handler).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          query: aggregate.query,
        })
      )
    })
  })

  describe('interface.error', () => {
    it('is a dictionary of functions keyed by the intersection of aggregate definition.errors[*].name and command definition.raisableErrors', () => {
      expect(definition.errors.length > 0).toBe(true)

      const anErrorName = sample(definition.errors).name
      const DoThisCommand = {
        name: 'DoThis',
        raisableErrors: [anErrorName, 'ANonDefinedError'],
        emittableEvents: [],
        handler: jest.fn(() => {}),
      }
      const AggregateType = Aggregate({
        ...definition,
        commands: [DoThisCommand],
      })

      const aggregate = AggregateType('x')
      aggregate.execute.DoThis({})

      expect(DoThisCommand.handler).toHaveBeenCalledTimes(1)
      const errorInterface = DoThisCommand.handler.mock.calls[0][1].error
      expect(Object.keys(errorInterface)).toEqual([anErrorName])
    })
    it('every value of the dictionary is one member of the aggregate definition.errors[] list', () => {
      const ErrorType = CustomError({ name: 'AnError' })

      const DoThisCommand = {
        name: 'DoThis',
        raisableErrors: [ErrorType.name],
        emittableEvents: [],
        handler: jest.fn(() => {}),
      }
      const AggregateType = Aggregate({
        ...definition,
        errors: [ErrorType],
        commands: [DoThisCommand],
      })

      const aggregate = AggregateType('x')
      aggregate.execute.DoThis({})

      expect(DoThisCommand.handler).toHaveBeenCalledTimes(1)
      const errorInterface = DoThisCommand.handler.mock.calls[0][1].error
      expect(errorInterface.AnError).toBe(ErrorType)
    })
  })

  describe('interface.emit', () => {
    const TestEvent = DomainEvent({
      name: 'TestEvent',
      reducer: (state, payload) => ({
        ...state,
        total: state.total + payload,
      }),
    })
    const TestCommandImplicit = {
      name: 'TestCommandImplicit',
      raisableErrors: [],
      emittableEvents: [TestEvent.name],
      handler: jest.fn((x, { emit }) => {
        emit.TestEvent(x)
      }),
    }
    const TestCommandStrict = {
      name: 'TestCommandStrict',
      raisableErrors: [],
      emittableEvents: [TestEvent.name],
      handler: jest.fn((x, { emit }) => {
        emit.TestEvent(x, STRICT_CONSISTENCY_POLICY)
      }),
    }
    const TestCommandSoft = {
      name: 'TestCommandSoft',
      raisableErrors: [],
      emittableEvents: [TestEvent.name],
      handler: jest.fn((x, { emit }) => {
        emit.TestEvent(x, SOFT_CONSISTENCY_POLICY)
      }),
    }
    const TestCommandNo = {
      name: 'TestCommandNo',
      raisableErrors: [],
      emittableEvents: [TestEvent.name],
      handler: jest.fn((x, { emit }) => {
        emit.TestEvent(x, NO_CONSISTENCY_POLICY)
      }),
    }
    const AggregateType = Aggregate({
      ...definition,
      initialState: { total: 0 },
      queries: [
        {
          name: 'getTotal',
          handler: state => state.total,
        },
      ],
      events: [TestEvent],
      commands: [
        TestCommandImplicit,
        TestCommandStrict,
        TestCommandSoft,
        TestCommandNo,
      ],
    })

    it('is a dictionary of functions keyed by the intersection of aggregate definition.events[*].name and command definition.emittableEvents', () => {
      expect(definition.events.length > 0).toBe(true)

      const randomEventName = sample(definition.events).name
      const DoThisCommand = {
        name: 'DoThis',
        raisableErrors: [],
        emittableEvents: [randomEventName, 'ANotExistingEvent'],
        handler: jest.fn(() => {}),
      }
      const AggregateType = Aggregate({
        ...definition,
        commands: [DoThisCommand],
      })

      const aggregate = AggregateType('x')
      aggregate.execute.DoThis()

      expect(DoThisCommand.handler).toHaveBeenCalledTimes(1)
      const emitInterface = DoThisCommand.handler.mock.calls[0][1].emit
      expect(Object.keys(emitInterface)).toEqual([randomEventName])
    })

    describe('interface.emit.SomethingHappened(payload?: any)', () => {
      it('a SomethingHappened event instance is added to the list of the produced events. event.payload === payload', () => {
        const input = {}
        const aggregate = AggregateType('x')
        aggregate.execute.TestCommandImplicit(input)

        const producedEvents = aggregate.getNewEvents()
        expect(producedEvents.length).toBe(1)
        expect(producedEvents[0] instanceof TestEvent).toBe(true)
        expect(producedEvents[0].payload).toBe(input)
      })
      it('the aggregate internal state is updated through the produced event reducer', () => {
        const aggregate = AggregateType('x')
        expect(aggregate.query.getTotal()).toBe(0)

        const input = Math.random()
        aggregate.execute.TestCommandImplicit(input)
        expect(aggregate.query.getTotal()).toBe(input)
      })
      it('the aggregate version does not change', () => {
        const aggregate = AggregateType('x')
        expect(aggregate.getNewEvents().length > 0).toBe(false)
        aggregate.execute.TestCommandImplicit(1)
        expect(aggregate.getNewEvents().length > 0).toBe(true)
        expect(aggregate.version).toBe(0)
      })
    })

    describe('interface.emit.SomethingHappened(payload?: any, STRICT_CONSISTENCY_POLICY || undefined)', () => {
      it('aggregate internal consistency policy is set to STRICT_CONSISTENCY_POLICY', () => {
        const TestEvent = DomainEvent({
          name: 'TestEvent',
          reducer: () => {},
        })
        const TestCommandExplicitPolicy = {
          name: 'TestCommandExplicitPolicy',
          raisableErrors: [],
          emittableEvents: [TestEvent.name],
          handler: jest.fn((x, { emit }) => {
            emit.TestEvent(x, STRICT_CONSISTENCY_POLICY)
          }),
        }
        const TestCommandImplicitPolicy = {
          name: 'TestCommandImplicitPolicy',
          raisableErrors: [],
          emittableEvents: [TestEvent.name],
          handler: jest.fn((x, { emit }) => {
            emit.TestEvent(x)
          }),
        }
        const AggregateType = Aggregate({
          ...definition,
          initialState: { total: 0 },
          events: [TestEvent],
          commands: [TestCommandExplicitPolicy, TestCommandImplicitPolicy],
          queries: [
            {
              name: 'getTotal',
              handler: state => state.total,
            },
          ],
        })

        const aggregateExplicit = AggregateType('x')
        aggregateExplicit.execute.TestCommandExplicitPolicy()
        const aggregateImplicit = AggregateType('x')
        aggregateImplicit.execute.TestCommandImplicitPolicy()

        expect(aggregateExplicit.getConsistencyPolicy()).toBe(
          STRICT_CONSISTENCY_POLICY
        )
        expect(aggregateImplicit.getConsistencyPolicy()).toBe(
          STRICT_CONSISTENCY_POLICY
        )
      })
    })

    describe('interface.emit.SomethingHappened(payload?: any, SOFT_CONSISTENCY_POLICY)', () => {
      it('aggregate internal consistency policy is set to SOFT_CONSISTENCY_POLICY if no events were emitted before with `undefined` or STRICT_CONSISTENCY_POLICY, otherwise it remains equal to STRICT_CONSISTENCY_POLICY', () => {
        const aggregate = AggregateType('x')
        aggregate.execute.TestCommandSoft()
        expect(aggregate.getConsistencyPolicy()).toBe(SOFT_CONSISTENCY_POLICY)

        const other = AggregateType('x')
        other.execute.TestCommandImplicit()
        other.execute.TestCommandSoft()
        expect(other.getConsistencyPolicy()).toBe(STRICT_CONSISTENCY_POLICY)

        const another = AggregateType('x')
        another.execute.TestCommandStrict()
        another.execute.TestCommandSoft()
        expect(another.getConsistencyPolicy()).toBe(STRICT_CONSISTENCY_POLICY)
      })
    })

    describe('interface.emit.SomethingHappened(payload?: any, NO_CONSISTENCY_POLICY)', () => {
      it('aggregate internal consistency policy is set to NO_CONSISTENCY_POLICY if no events were emitted before with `undefined`, STRICT_CONSISTENCY_POLICY or SOFT_CONSISTENCY_POLICY, otherwise it remains equal to either STRICT_CONSISTENCY_POLICY or SOFT_CONSISTENCY_POLICY', () => {
        const aggregate = AggregateType('x')
        aggregate.execute.TestCommandNo()
        expect(aggregate.getConsistencyPolicy()).toBe(NO_CONSISTENCY_POLICY)

        const other = AggregateType('x')
        other.execute.TestCommandSoft()
        other.execute.TestCommandNo()
        expect(other.getConsistencyPolicy()).toBe(SOFT_CONSISTENCY_POLICY)

        const another = AggregateType('x')
        another.execute.TestCommandStrict()
        another.execute.TestCommandNo()
        expect(another.getConsistencyPolicy()).toBe(STRICT_CONSISTENCY_POLICY)

        const anotherone = AggregateType('x')
        anotherone.execute.TestCommandImplicit()
        anotherone.execute.TestCommandNo()
        expect(anotherone.getConsistencyPolicy()).toBe(
          STRICT_CONSISTENCY_POLICY
        )
      })
    })
  })
})
