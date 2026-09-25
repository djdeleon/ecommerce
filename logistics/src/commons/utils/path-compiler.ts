/**
 * Automatically replaces placeholder keys (like ":facilityId") with real resource parameters.
 */
export function compilePath(staticFullUrl: string, params: Record<string, string | number>): string {
  let compiled = staticFullUrl

  for (const [key, value] of Object.entries(params)) {
    compiled = compiled.replace(`:${key}`, String(value))
  }

  return compiled
}