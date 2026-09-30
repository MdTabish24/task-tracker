import nodemailer from "nodemailer";
import { config } from "../config";

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  if (!config.SMTP_USER || !config.SMTP_APP_PASSWORD) {
    process.stdout.write(`Verification code for ${email}: ${code}\n`);
    return;
  }
  await nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: config.SMTP_USER, pass: config.SMTP_APP_PASSWORD.replace(/\s/g, "") },
  }).sendMail({
    from: `Task Tracker <${config.SMTP_USER}>`,
    to: email,
    subject: "Verify your Task Tracker account",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
  });
}
