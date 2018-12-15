export const getEventTypeDefinition = () => ({
  name: 'SomethingHappened',
  description: 'A description',
  reducer: (state, event) =>
    Array.isArray(state)
      ? [...state, event.data]
      : {
          ...state,
          [event.data.key]: event.data.value,
        },
})
