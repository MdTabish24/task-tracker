import * as timeLogRepository from "../repositories/timeLogRepository";
import type { SummaryQuery } from "../schemas/summary";

export async function getSummary(userId: string, { from, to }: SummaryQuery) {
  const tasks = await timeLogRepository.sumSecondsByTask(userId, from, to);
  return { totalSeconds: tasks.reduce((total, task) => total + task.seconds, 0), tasks };
}
