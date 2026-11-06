/**
 * Builds the SET clause pieces for a partial UPDATE.
 * Keys with `undefined` values are skipped; `null` sets the column to NULL.
 */
export function buildUpdate(
  fields: Record<string, unknown>,
  columnMap: Record<string, string>,
): { sets: string[]; values: unknown[] } {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(columnMap)) {
    const value = fields[key];
    if (value !== undefined) {
      values.push(value);
      sets.push(`${column} = $${values.length}`);
    }
  }
  return { sets, values };
}
