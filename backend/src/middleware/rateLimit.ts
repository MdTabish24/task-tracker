import { rateLimit } from "express-rate-limit";
import { config } from "../config";
import { AppError } from "../errors";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.NODE_ENV === "test",
  handler: (_req, _res, next) => next(new AppError(429, "Too many attempts, try again later")),
});
