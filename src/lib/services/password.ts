export function mockHashPassword(password: string): string {
  return `mock-sha:${btoa(unescape(encodeURIComponent(`music-app:${password}`)))}`;
}

export function verifyMockPassword(password: string, storedHash: string): boolean {
  return mockHashPassword(password) === storedHash;
}
