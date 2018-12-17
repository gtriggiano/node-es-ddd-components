export function getAggregateName(
  type: string,
  identity: string | void
): string {
  return `${type}${identity ? `(${identity})` : ``}`
}
