/**
 * Map an unknown thrown value to a user-facing message. Local writes throw
 * `DataError` (see `data/errors.ts`) for anything the UI should surface
 * as-is; anything else (a bug, a filesystem error) falls back to `fallback`.
 */
import { DataError } from '../data/errors';

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof DataError) return error.message;
  return fallback;
}
