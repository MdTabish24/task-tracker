import { Router } from "express";
import * as timerController from "../controllers/timerController";

export const timerRoutes = Router();

timerRoutes.post("/stop", timerController.stop);
timerRoutes.get("/active", timerController.active);
