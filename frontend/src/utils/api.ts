const BASE_URL = '/api/v1';

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('sahaja_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Handle unauthorized or forbidden responses globally
  if (response.status === 401 || response.status === 403) {
    // Clean up stored auth data
    localStorage.removeItem('sahaja_token');
    localStorage.removeItem('sahaja_user');

    // Throw error to propagate the failure
    throw new Error('Sesi tidak valid atau akses ditolak.');
  }

  if (response.status === 204) {
    return {} as T;
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || 'Terjadi kesalahan pada server.');
  }

  return data as T;
}
