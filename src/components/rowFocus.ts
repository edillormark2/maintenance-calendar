/**
 * The id of a row's action: its Mark done button, or its "Done" label once it's
 * done. Only one of the two is on the page at a time, so they share the id, and
 * focus can be put back on the row after Undo or after closing the message.
 */
export function rowActionId(itemId: string): string {
  return `row-action-${itemId}`
}
