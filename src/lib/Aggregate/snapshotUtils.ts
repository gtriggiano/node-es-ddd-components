export const getSnaphotNamespace = (
  snapshotPrefix: string | void,
  context: string
): string =>
  `${snapshotPrefix ? `${snapshotPrefix}:` : ``}AGGREGATE_SNAPSHOT:${context}:`

export const getSnaphotKey = (namespace: string, name: string): string =>
  `${namespace}${name}`
