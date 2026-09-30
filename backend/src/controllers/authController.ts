import type { RequestHandler } from "express";
import * as authService from "../services/authService";

export const signup: RequestHandler = async (req, res) => {
  res.status(202).json(await authService.signup(req.body));
};

export const verifySignup: RequestHandler = async (req, res) => {
  res.status(201).json(await authService.verifySignup(req.body));
};

export const resendCode: RequestHandler = async (req, res) => {
  res.status(202).json(await authService.resendCode(req.body));
};

export const login: RequestHandler = async (req, res) => {
  res.json(await authService.login(req.body));
};

export const me: RequestHandler = async (req, res) => {
  res.json(await authService.getCurrentUser(req.userId));
};
