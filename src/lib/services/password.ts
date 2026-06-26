export function mockHashPassword(password: string): string {
  let hash = 0;
  const input = `music-app:${password}`;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return `mock-hash:${hash.toString(16)}`;
}

export function verifyMockPassword(password: string, storedHash: string): boolean {
  return mockHashPassword(password) === storedHash;
}
