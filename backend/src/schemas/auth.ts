import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email());

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1),
});

export const verifySignupSchema = z.object({ email, code: z.string().regex(/^\d{6}$/) });
export const resendCodeSchema = z.object({ email });

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifySignupInput = z.infer<typeof verifySignupSchema>;
export type ResendCodeInput = z.infer<typeof resendCodeSchema>;
