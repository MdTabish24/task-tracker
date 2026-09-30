import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../errors";

export const notFoundHandler: RequestHandler = () => {
  throw new AppError(404, "Route not found");
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { message: err.message, details: err.details } });
    return;
  }
  if (err.type === "entity.parse.failed") {
    res.status(400).json({ error: { message: "Invalid JSON body" } });
    return;
  }
  process.stderr.write(`${err.stack ?? err}\n`);
  res.status(500).json({ error: { message: "Internal server error" } });
};
