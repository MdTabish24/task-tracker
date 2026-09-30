import jwt from "jsonwebtoken";
import { config } from "../config";

export const signToken = (userId: string) =>
  jwt.sign({}, config.JWT_SECRET, {
    subject: userId,
    algorithm: "HS256",
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

export function verifyToken(token: string): string {
  const { sub } = jwt.verify(token, config.JWT_SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload;
  if (!sub) throw new Error("Token has no subject");
  return sub;
}
