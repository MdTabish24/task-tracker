import { Router } from "express";
import * as authController from "../controllers/authController";
import { authenticate } from "../middleware/authenticate";
import { authLimiter } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import { loginSchema, signupSchema } from "../schemas/auth";

export const authRoutes = Router();

authRoutes.post("/signup", authLimiter, validate({ body: signupSchema }), authController.signup);
authRoutes.post("/login", authLimiter, validate({ body: loginSchema }), authController.login);
authRoutes.get("/me", authenticate, authController.me);
