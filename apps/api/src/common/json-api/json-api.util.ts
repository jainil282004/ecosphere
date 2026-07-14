/**
 * JSON:API (https://jsonapi.org/) helpers for REST responses and errors.
 */

export interface JsonApiResource<T extends Record<string, unknown> = Record<string, unknown>> {
  type: string;
  id: string;
  attributes: T;
  relationships?: Record<string, unknown>;
}

export interface JsonApiDocument<T extends Record<string, unknown> = Record<string, unknown>> {
  data: JsonApiResource<T> | JsonApiResource<T>[] | null;
  meta?: Record<string, unknown>;
  links?: Record<string, string>;
}

export interface JsonApiError {
  status: string;
  title: string;
  detail?: string;
  source?: { pointer?: string; parameter?: string };
  meta?: Record<string, unknown>;
}

export interface JsonApiErrorDocument {
  errors: JsonApiError[];
}

export function jsonApiResource<T extends Record<string, unknown>>(
  type: string,
  id: string,
  attributes: T,
  relationships?: Record<string, unknown>,
): JsonApiResource<T> {
  return { type, id, attributes, ...(relationships ? { relationships } : {}) };
}

export function jsonApiDocument<T extends Record<string, unknown>>(
  data: JsonApiResource<T> | JsonApiResource<T>[] | null,
  meta?: Record<string, unknown>,
): JsonApiDocument<T> {
  return meta ? { data, meta } : { data };
}

export function jsonApiError(
  status: number,
  title: string,
  detail?: string,
  source?: JsonApiError['source'],
): JsonApiErrorDocument {
  return {
    errors: [
      {
        status: String(status),
        title,
        ...(detail ? { detail } : {}),
        ...(source ? { source } : {}),
      },
    ],
  };
}

export function jsonApiValidationErrors(
  status: number,
  fieldErrors: Record<string, string[]>,
): JsonApiErrorDocument {
  const errors: JsonApiError[] = [];

  for (const [field, messages] of Object.entries(fieldErrors)) {
    for (const message of messages) {
      errors.push({
        status: String(status),
        title: 'Validation Failed',
        detail: message,
        source: { pointer: `/data/attributes/${field}` },
      });
    }
  }

  return { errors };
}
