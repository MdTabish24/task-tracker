import type { RequestHandler } from "express";
import * as taskService from "../services/taskService";

export const create: RequestHandler = async (req, res) => {
  res.status(201).json(await taskService.create(req.userId, req.body));
};

export const list: RequestHandler = async (req, res) => {
  res.json(await taskService.list(req.userId));
};

export const get: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await taskService.get(req.userId, req.params.id));
};

export const update: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await taskService.update(req.userId, req.params.id, req.body));
};

export const remove: RequestHandler<{ id: string }> = async (req, res) => {
  await taskService.remove(req.userId, req.params.id);
  res.status(204).end();
};
