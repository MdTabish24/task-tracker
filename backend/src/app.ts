import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config";
import { authenticate } from "./middleware/authenticate";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRoutes } from "./routes/authRoutes";
import { taskRoutes } from "./routes/taskRoutes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGINS }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.use("/api/auth", authRoutes);
app.use("/api/tasks", authenticate, taskRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
