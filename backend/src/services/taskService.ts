import { AppError } from "../errors";
import * as taskRepository from "../repositories/taskRepository";
import type { CreateTaskInput, UpdateTaskInput } from "../schemas/task";

const notFound = () => new AppError(404, "Task not found");

export const list = taskRepository.findAll;
export const create = taskRepository.create;

export async function get(userId: string, id: string) {
  const task = await taskRepository.findById(userId, id);
  if (!task) throw notFound();
  return task;
}

export async function update(userId: string, id: string, patch: UpdateTaskInput) {
  const task = await taskRepository.update(userId, id, patch);
  if (!task) throw notFound();
  return task;
}

export async function remove(userId: string, id: string) {
  if (!(await taskRepository.remove(userId, id))) throw notFound();
}
