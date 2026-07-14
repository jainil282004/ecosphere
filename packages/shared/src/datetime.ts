import { z } from 'zod';

/** Parses ISO strings, date-only values, and browser `datetime-local` inputs. */
export function parseFlexibleDateTime(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Date is required');
  }

  let candidate = trimmed;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    candidate = `${trimmed}:00`;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    candidate = `${trimmed}T00:00:00`;
  }

  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date');
  }

  return parsed.toISOString();
}

export function isValidFlexibleDateTime(value: string): boolean {
  try {
    parseFlexibleDateTime(value);
    return true;
  } catch {
    return false;
  }
}

/** Use in React forms bound to `<input type="datetime-local" />` — no ISO transform. */
export const datetimeLocalInputSchema = z
  .string()
  .min(1, 'Date is required')
  .refine(isValidFlexibleDateTime, { message: 'Invalid date' });

/** Use in API payloads — normalizes any supported input to ISO-8601. */
export const flexibleDateTimeSchema = datetimeLocalInputSchema.transform(parseFlexibleDateTime);

export function toDatetimeLocalValue(date = new Date()): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
