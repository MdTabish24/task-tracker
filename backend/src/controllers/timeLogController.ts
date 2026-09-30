import type { RequestHandler } from "express";
import type { ListTimeLogsQuery } from "../schemas/timeLog";
import * as timeLogService from "../services/timeLogService";

export const list: RequestHandler = async (req, res) => {
  // validate() has already replaced req.query with the parsed (number-coerced) value.
  res.json(await timeLogService.list(req.userId, req.query as unknown as ListTimeLogsQuery));
};
