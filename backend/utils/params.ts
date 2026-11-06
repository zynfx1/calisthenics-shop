import { AppError } from './errors';

/** Parses a positive-integer route param; anything else is a 404. */
export function parseId(value: string | undefined): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(404, 'NOT_FOUND', 'Resource not found');
  return id;
}
