import { Router } from "express";
import * as taskController from "../controllers/taskController";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../schemas/common";
import { createTaskSchema, updateTaskSchema } from "../schemas/task";

export const taskRoutes = Router();

const byId = validate({ params: idParamSchema });

taskRoutes.post("/", validate({ body: createTaskSchema }), taskController.create);
taskRoutes.get("/", taskController.list);
taskRoutes.get("/:id", byId, taskController.get);
taskRoutes.patch("/:id", validate({ params: idParamSchema, body: updateTaskSchema }), taskController.update);
taskRoutes.delete("/:id", byId, taskController.remove);
