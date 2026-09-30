import { Router } from "express";
import * as timeLogController from "../controllers/timeLogController";
import { validate } from "../middleware/validate";
import { listTimeLogsQuerySchema } from "../schemas/timeLog";

export const timeLogRoutes = Router();

timeLogRoutes.get("/", validate({ query: listTimeLogsQuerySchema }), timeLogController.list);
