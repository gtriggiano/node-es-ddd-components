type TupleItem = string | number | boolean | undefined | null | void | {}

// tslint:disable readonly-array
export const tuple = <T extends TupleItem[]>(...args: T) => args
// tslint:enable
