import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../errors";

type Schemas = Partial<Record<"body" | "params" | "query", z.ZodType>>;

export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    for (const [part, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[part as keyof Schemas]);
      if (!result.success) {
        throw new AppError(400, "Validation failed", z.flattenError(result.error).fieldErrors);
      }
      Object.defineProperty(req, part, { value: result.data, configurable: true, writable: true });
    }
    next();
  };
