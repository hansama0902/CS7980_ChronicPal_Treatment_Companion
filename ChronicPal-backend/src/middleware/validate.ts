import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodSchema } from 'zod';

type RequestSource = 'body' | 'query' | 'params';

/**
 * Generic Zod validation middleware factory.
 * Parses the specified request source against the schema and returns 400 on failure.
 * On success the parsed (coerced) data replaces the original source.
 */
export function validate(schema: ZodSchema, source: RequestSource = 'body'): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error.errors.map((e) => e.message).join('; '),
      });
      return;
    }
    // Replace with coerced/defaults-applied data
    (req as Request & Record<string, unknown>)[source] = result.data;
    next();
  };
}
