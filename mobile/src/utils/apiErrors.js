/**
 * Normalize API errors from Civic Pulse backend (string `error` or express-validator `errors[]`).
 */
export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  const data = err?.response?.data;
  if (!data) {
    return err?.message || fallback;
  }
  if (typeof data.error === 'string' && data.error.trim()) {
    return data.error;
  }
  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors
      .map((e) => e.msg || e.message || String(e))
      .filter(Boolean)
      .join('\n');
  }
  return fallback;
}
