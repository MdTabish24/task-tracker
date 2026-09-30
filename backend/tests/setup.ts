import { afterAll, beforeAll, beforeEach, vi } from "vitest";
import { pool } from "../src/db";
import { migrate } from "../src/db/migrate";

vi.mock("../src/services/emailService", () => ({
  sendVerificationCode: vi.fn(async (_email: string, code: string) => {
    process.env.TEST_VERIFICATION_CODE = code;
  }),
}));

beforeAll(migrate);
beforeEach(async () => {
  await pool.query("TRUNCATE users CASCADE");
  await pool.query("TRUNCATE pending_signups");
});
afterAll(() => pool.end());
