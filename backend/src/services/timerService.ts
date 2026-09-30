import { isUniqueViolation } from "../db";
import { AppError } from "../errors";
import * as timeLogRepository from "../repositories/timeLogRepository";

export async function start(userId: string, taskId: string) {
  const log = await timeLogRepository.start(userId, taskId).catch((err) => {
    throw isUniqueViolation(err) ? new AppError(409, "A timer is already running") : err;
  });
  if (!log) throw new AppError(404, "Task not found");
  return log;
}

export async function stop(userId: string) {
  const log = await timeLogRepository.stopActive(userId);
  if (!log) throw new AppError(404, "No active timer");
  return log;
}

export async function getActive(userId: string) {
  const active = await timeLogRepository.findActive(userId);
  if (!active) return { timeLog: null, now: new Date() };
  const { now, ...timeLog } = active;
  return { timeLog, now };
}
