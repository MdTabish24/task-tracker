import type { RequestHandler } from "express";
import * as timerService from "../services/timerService";

export const start: RequestHandler<{ id: string }> = async (req, res) => {
  res.status(201).json(await timerService.start(req.userId, req.params.id));
};

export const stop: RequestHandler = async (req, res) => {
  res.json(await timerService.stop(req.userId));
};

export const active: RequestHandler = async (req, res) => {
  res.json(await timerService.getActive(req.userId));
};
