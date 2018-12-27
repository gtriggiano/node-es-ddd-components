/**
 * A function to generate the first part of a snaphot persistence key
 * @param snapshotPrefix The prefix to use to generate the snapshot key namespace
 * @param context The name of the bounded context the aggregate belongs to
 */
export const getSnaphotNamespace = (
  snapshotPrefix: string | void,
  context: Readonly<string>
): string =>
  `${snapshotPrefix ? `${snapshotPrefix}:` : ``}AGGREGATE_SNAPSHOT:${context}:`

/**
 * A function to generate a snaphot persistence key
 * @param namespace The first part of a snaphot persistence key
 * @param name The name of the aggregate
 */
export const getSnaphotKey = (namespace: string, name: string): string =>
  `${namespace}${name}`
