import type { RequestHandler } from "express";
import { AppError } from "../errors";
import { verifyToken } from "../utils/jwt";

declare module "express-serve-static-core" {
  interface Request {
    userId: string;
  }
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) throw new AppError(401, "Authentication required");
  try {
    req.userId = verifyToken(token);
  } catch {
    throw new AppError(401, "Invalid or expired token");
  }
  next();
};
