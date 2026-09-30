import { Router } from "express";
import * as taskController from "../controllers/taskController";
import * as timerController from "../controllers/timerController";
import { suggestLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../schemas/common";
import { createTaskSchema, suggestTaskSchema, updateTaskSchema } from "../schemas/task";

export const taskRoutes = Router();

const byId = validate({ params: idParamSchema });

taskRoutes.post("/", validate({ body: createTaskSchema }), taskController.create);
taskRoutes.post("/suggest", suggestLimiter, validate({ body: suggestTaskSchema }), taskController.suggest);
taskRoutes.get("/", taskController.list);
taskRoutes.get("/:id", byId, taskController.get);
taskRoutes.patch("/:id", validate({ params: idParamSchema, body: updateTaskSchema }), taskController.update);
taskRoutes.delete("/:id", byId, taskController.remove);
taskRoutes.post("/:id/timer/start", byId, timerController.start);
