export function buildCommandIntent(command: string) {
  return `@command/${command}`;
}

export function isClass<T extends abstract new (...args: any) => any>(cls: unknown): cls is T {
  return typeof cls === "function" && /class/.test(cls.toString());
}
