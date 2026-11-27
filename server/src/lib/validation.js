import { z, ZodError } from 'zod';

export { z, ZodError };

export function formatIssues(err) {
  const out = {};
  for (const issue of err.issues) out[issue.path.join('.') || '_'] = issue.message;
  return out;
}
