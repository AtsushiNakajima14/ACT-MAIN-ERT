export function isUnauthorizedError(error: Error): boolean {
  return /^401/.test(error.message) || error.message.includes('Authentication required') || error.message.includes('Unauthorized');
}