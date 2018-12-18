export interface Todo {
  readonly identity: string
  readonly text: string
  readonly done: boolean
}

export interface TodoListState {
  readonly identity?: string

  readonly hasBeenClosed?: boolean

  readonly todos: ReadonlyArray<Todo>
}

export const initialState: TodoListState = {
  todos: [],
}
