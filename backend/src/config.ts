import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/, "use a duration like 24h").default("24h"),
  CORS_ORIGINS: z.string().transform((list) => list.split(",").map((origin) => origin.trim())),
  SMTP_USER: z.email().optional(),
  SMTP_APP_PASSWORD: z.string().min(16).optional(),
}).refine((env) => env.NODE_ENV !== "production" || (env.SMTP_USER && env.SMTP_APP_PASSWORD), {
  message: "SMTP_USER and SMTP_APP_PASSWORD are required in production",
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  throw new Error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
}

export const config = parsed.data;
