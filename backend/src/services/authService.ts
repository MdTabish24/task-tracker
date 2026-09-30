import { createHmac, randomInt } from "node:crypto";
import { config } from "../config";
import { isUniqueViolation } from "../db";
import { AppError } from "../errors";
import * as pendingSignupRepository from "../repositories/pendingSignupRepository";
import * as userRepository from "../repositories/userRepository";
import type { LoginInput, ResendCodeInput, SignupInput, VerifySignupInput } from "../schemas/auth";
import { signToken } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";
import { sendVerificationCode } from "./emailService";

const codeHash = (email: string, code: string) =>
  createHmac("sha256", config.JWT_SECRET).update(`${email}:${code}`).digest("hex");

export async function signup({ name, email, password }: SignupInput) {
  if (await userRepository.findByEmail(email)) throw new AppError(409, "Email is already registered");
  const code = String(randomInt(100000, 1000000));
  const hash = codeHash(email, code);
  const passwordHash = await hashPassword(password);
  if (!(await pendingSignupRepository.save(name, email, passwordHash, hash))) {
    throw new AppError(429, "Wait one minute before requesting another code");
  }
  try { await sendVerificationCode(email, code); }
  catch {
    await pendingSignupRepository.clear(email, hash);
    throw new AppError(500, "Could not send verification code");
  }
  return { message: "Verification code sent" };
}

export async function verifySignup({ email, code }: VerifySignupInput) {
  try {
    const user = await pendingSignupRepository.consume(email, codeHash(email, code));
    if (user) return { token: signToken(user.id), user };
  } catch (err) {
    throw isUniqueViolation(err) ? new AppError(409, "Email is already registered") : err;
  }
  await pendingSignupRepository.recordFailedAttempt(email);
  throw new AppError(400, "Invalid or expired verification code");
}

export async function resendCode({ email }: ResendCodeInput) {
  const code = String(randomInt(100000, 1000000));
  const hash = codeHash(email, code);
  if (!(await pendingSignupRepository.refreshCode(email, hash))) {
    throw new AppError(429, "Wait one minute before requesting another code");
  }
  try { await sendVerificationCode(email, code); }
  catch {
    await pendingSignupRepository.clear(email, hash);
    throw new AppError(500, "Could not send verification code");
  }
  return { message: "Verification code sent" };
}

export async function login({ email, password }: LoginInput) {
  const invalid = new AppError(401, "Invalid email or password");
  const found = await userRepository.findByEmail(email);
  if (!found) throw invalid;
  const { passwordHash, ...user } = found;
  if (!(await verifyPassword(password, passwordHash))) throw invalid;
  return { token: signToken(user.id), user };
}

export async function getCurrentUser(userId: string) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError(401, "Authentication required");
  return user;
}
