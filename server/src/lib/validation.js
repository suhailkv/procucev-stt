/**
 * lib/validation — wraps `zod`.
 * Modules import `z` from here, never from 'zod' directly, so the
 * validation library can be swapped in one place.
 */
import { z, ZodError } from 'zod';

export { z, ZodError };

/** Turns zod issues into a compact `{ field: message }` map for API responses. */
export function formatIssues(err) {
  const out = {};
  for (const issue of err.issues) out[issue.path.join('.') || '_'] = issue.message;
  return out;
}
