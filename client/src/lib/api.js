export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fieldMsg = data.details && typeof data.details === 'object' ? Object.values(data.details)[0] : null;
    throw new ApiError(res.status, fieldMsg || data.error || `Request failed (${res.status})`, data.details);
  }
  return data;
}

export const transcriptionsApi = {
  list: ({ q = '', page = 1, limit = 10 } = {}) =>
    request('GET', `/transcriptions?${new URLSearchParams({ q, page, limit })}`),
  get: (id) => request('GET', `/transcriptions/${id}`),
  create: (data) => request('POST', '/transcriptions', data),
  update: (id, data) => request('PUT', `/transcriptions/${id}`, data),
  remove: (id) => request('DELETE', `/transcriptions/${id}`),
};

export const healthApi = {
  get: () => request('GET', '/health'),
};
