import cors from "cors";
import express from "express";
import helmet from "helmet";
import { config } from "./config";
import { authenticate } from "./middleware/authenticate";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRoutes } from "./routes/authRoutes";
import { summaryRoutes } from "./routes/summaryRoutes";
import { taskRoutes } from "./routes/taskRoutes";
import { timeLogRoutes } from "./routes/timeLogRoutes";
import { timerRoutes } from "./routes/timerRoutes";

export const app = express();

// Render terminates TLS behind one proxy; without this every client shares the proxy's IP in rate limiting.
if (config.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGINS }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.use("/api/auth", authRoutes);
app.use("/api/tasks", authenticate, taskRoutes);
app.use("/api/timer", authenticate, timerRoutes);
app.use("/api/summary", authenticate, summaryRoutes);
app.use("/api/time-logs", authenticate, timeLogRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
