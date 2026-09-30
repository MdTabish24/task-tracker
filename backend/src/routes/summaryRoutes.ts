import { Router } from "express";
import * as summaryController from "../controllers/summaryController";
import { validate } from "../middleware/validate";
import { summaryQuerySchema } from "../schemas/summary";

export const summaryRoutes = Router();

summaryRoutes.get("/", validate({ query: summaryQuerySchema }), summaryController.get);
