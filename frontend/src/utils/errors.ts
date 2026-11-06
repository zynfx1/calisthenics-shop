import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '@/types';

export function apiError(err: unknown): ApiErrorBody {
  if (isAxiosError(err)) {
    const body = err.response?.data?.error as ApiErrorBody | undefined;
    if (body) return body;
    if (!err.response) {
      return { code: 'NETWORK_ERROR', message: 'Can’t reach the server. Check your connection and try again.' };
    }
  }
  return { code: 'UNKNOWN', message: 'Something went wrong. Try again.' };
}

/** Turns the API's `details` array into { field: message } for form inputs. */
export function fieldErrors(err: ApiErrorBody): Record<string, string> {
  const out: Record<string, string> = {};
  if (err.code === 'VALIDATION_ERROR') {
    for (const d of err.details ?? []) if (d.field) out[d.field] = d.message;
  }
  return out;
}
