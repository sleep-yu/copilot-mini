export function isError<T = unknown>(value: unknown): value is Error & T {
  return value instanceof Error;
}
