import { type Options, rateLimit } from "express-rate-limit";
import { config } from "../config";
import { AppError } from "../errors";

const limiter = (options: Partial<Options>) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => next(new AppError(429, "Too many requests, try again later")),
    ...options,
  });

export const authLimiter = limiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skip: () => config.NODE_ENV === "test",
});

export const suggestLimiter = limiter({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req) => req.userId,
});
