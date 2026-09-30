import { DatabaseError } from "pg";
import { AppError } from "../errors";
import * as userRepository from "../repositories/userRepository";
import type { LoginInput, SignupInput } from "../schemas/auth";
import { signToken } from "../utils/jwt";
import { hashPassword, verifyPassword } from "../utils/password";

const UNIQUE_VIOLATION = "23505";

export async function signup({ name, email, password }: SignupInput) {
  const passwordHash = await hashPassword(password);
  try {
    const user = await userRepository.create(name, email, passwordHash);
    return { token: signToken(user.id), user };
  } catch (err) {
    if (err instanceof DatabaseError && err.code === UNIQUE_VIOLATION) {
      throw new AppError(409, "Email is already registered");
    }
    throw err;
  }
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
