import type { RequestHandler } from "express";
import type { SummaryQuery } from "../schemas/summary";
import * as summaryService from "../services/summaryService";

export const get: RequestHandler<unknown, unknown, unknown, SummaryQuery> = async (req, res) => {
  res.json(await summaryService.getSummary(req.userId, req.query));
};
