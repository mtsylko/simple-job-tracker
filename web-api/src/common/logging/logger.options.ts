import type { Params } from 'nestjs-pino';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Auth rides in a cookie and the bearer header, so both are redacted before a
 * line is ever written — request logging must never make a session stealable
 * from the log stream.
 */
const REDACTED_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]'
];

/**
 * Values safe to log: fixed enums, booleans and dates. Everything else is either
 * free text (`notes`, `company`) or a user-authored taxonomy (`role`, `level`,
 * `cv`), which the analytics rule in web-front/src/CLAUDE.md already keeps out of
 * anything we persist. `type` is deliberately absent — a fixed enum on job-fields
 * but a user taxonomy on jobs, so allowing it by name would leak on one route.
 */
const LOGGABLE_BODY_VALUES = new Set([
  'status',
  'outcome',
  'isProductCompany',
  'appliedAt',
  'enabled',
  'required'
]);

const MAX_LOGGED_VALUE_LENGTH = 64;

/**
 * Field *names* are schema, not user data, so the full list is safe and shows the
 * shape of a failing request; only allow-listed primitives get their value logged.
 */
function summarizeBody(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return undefined;
  }

  const source = body as Record<string, unknown>;
  const fields = Object.keys(source);
  if (fields.length === 0) {
    return undefined;
  }

  const values: Record<string, unknown> = {};
  for (const key of fields) {
    const value = source[key];
    // Objects and arrays are skipped even when allow-listed: nesting could carry
    // free text a name-based list cannot see.
    if (
      !LOGGABLE_BODY_VALUES.has(key) ||
      (value !== null && typeof value === 'object')
    ) {
      continue;
    }

    values[key] =
      typeof value === 'string'
        ? value.slice(0, MAX_LOGGED_VALUE_LENGTH)
        : value;
  }

  return Object.keys(values).length > 0 ? { fields, values } : { fields };
}

export const loggerOptions: Params = {
  pinoHttp: {
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    redact: { paths: REDACTED_PATHS, censor: '[redacted]' },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    // Headers are dropped wholesale (auth lives there) and bodies are reduced to
    // field names plus allow-listed values.
    serializers: {
      req: (req: {
        id: unknown;
        method: string;
        url: string;
        body?: unknown;
        raw?: { body?: unknown };
      }) => {
        const body = summarizeBody(req.raw?.body ?? req.body);
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          ...(body && { body })
        };
      }
    },
    // JSON to stdout in prod for the log shipper; human-readable locally.
    transport: isProduction
      ? undefined
      : { target: 'pino-pretty', options: { singleLine: true } }
  }
};
