import { pool } from "./index";
import { hashPassword } from "../utils/password";

const EMAIL = "test@example.com";
const PASSWORD = "password123";

async function seed(): Promise<void> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING RETURNING id`,
    ["Test User", EMAIL, await hashPassword(PASSWORD)],
  );
  const user = rows[0];
  if (user) {
    await pool.query(
      `INSERT INTO tasks (user_id, title, description) VALUES
         ($1, 'Follow up with UI Designer', 'Send a Slack message to confirm wireframe delivery status.'),
         ($1, 'Review pull requests', 'Go through the open PRs and leave feedback.')`,
      [user.id],
    );
  }
  process.stdout.write(user ? `Seeded ${EMAIL} / ${PASSWORD}\n` : `${EMAIL} already exists\n`);
}

seed().finally(() => pool.end());
