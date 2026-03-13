export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}

export function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0;
}
