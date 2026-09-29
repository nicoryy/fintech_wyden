/**
 * DataError — thrown by `src/data/*` for anything the UI should surface as a
 * message (a missing bank/category, an invalid backup file, …). Distinguishes
 * "expected, user-facing" failures from bugs/IO errors, which propagate as-is.
 */
export class DataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataError';
  }
}
