const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

interface JsonApiResourceDoc {
  type: string;
  id: string;
  attributes: Record<string, unknown>;
}

interface JsonApiEnvelope {
  data?: JsonApiResourceDoc | JsonApiResourceDoc[] | null;
  meta?: Record<string, unknown>;
}

function parseJsonApiError(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const doc = body as {
    message?: string;
    errors?: Array<{ detail?: string; title?: string; message?: string }>;
    detail?: string;
  };
  if (typeof doc.message === 'string' && doc.message.length > 0) return doc.message;
  if (Array.isArray(doc.errors) && doc.errors[0]) {
    return doc.errors[0].detail ?? doc.errors[0].title ?? doc.errors[0].message;
  }
  if (typeof doc.detail === 'string') return doc.detail;
  return undefined;
}

export function unwrapJsonApiResource<T>(body: unknown): T {
  if (!body || typeof body !== 'object') return body as T;
  const envelope = body as JsonApiEnvelope;
  if (!envelope.data || Array.isArray(envelope.data)) return body as T;
  const { id, attributes } = envelope.data;
  return { id, ...attributes } as T;
}



let refreshPromise: Promise<boolean> | null = null;



async function refreshSession(): Promise<boolean> {

  const response = await fetch(`${API_URL}/auth/refresh`, {

    method: 'POST',

    credentials: 'include',

  });



  if (!response.ok) {

    return false;

  }



  const data = (await response.json()) as JsonApiEnvelope;
  return Boolean(data.meta?.authenticated);

}



export class ApiError extends Error {

  status: number;

  body: unknown;



  constructor(message: string, status: number, body: unknown) {

    super(message);

    this.name = 'ApiError';

    this.status = status;

    this.body = body;

  }

}



interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  /** Do not attempt token refresh on 401 — used for logout. */
  skipAuthRefresh?: boolean;
}



export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {

  const url = new URL(`${API_URL}${path}`);

  if (options.params) {

    for (const [key, value] of Object.entries(options.params)) {

      if (value !== undefined) {

        url.searchParams.set(key, String(value));

      }

    }

  }



  const headers = new Headers(options.headers);

  if (options.body !== undefined) {

    headers.set('Content-Type', 'application/json');

  }



  let response = await fetch(url.toString(), {

    ...options,

    headers,

    credentials: 'include',

    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,

  });



  if (response.status === 401 && !options.skipAuthRefresh && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {

    refreshPromise ??= refreshSession().finally(() => {

      refreshPromise = null;

    });

    const refreshed = await refreshPromise;

    if (refreshed) {

      response = await fetch(url.toString(), {

        ...options,

        headers,

        credentials: 'include',

        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,

      });

    }

  }



  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = parseJsonApiError(body) ?? 'Request failed';
    throw new ApiError(message, response.status, body);
  }



  if (response.status === 204) {

    return undefined as T;

  }



  return response.json() as Promise<T>;
}

/** Download a file blob from the API (report exports). */
export async function apiDownload(
  path: string,
  options: RequestOptions = {},
): Promise<{ blob: Blob; filename: string }> {
  const url = new URL(`${API_URL}${path}`);
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers = new Headers(options.headers);
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(url.toString(), {
    ...options,
    method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && !options.skipAuthRefresh) {
    refreshPromise ??= refreshSession().finally(() => {
      refreshPromise = null;
    });
    const refreshed = await refreshPromise;
    if (refreshed) {
      response = await fetch(url.toString(), {
        ...options,
        method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
        headers,
        credentials: 'include',
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(parseJsonApiError(body) ?? 'Download failed', response.status, body);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? 'ecosphere-report.pdf';
  return { blob, filename };
}

export function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
