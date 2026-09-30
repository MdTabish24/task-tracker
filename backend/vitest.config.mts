import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      NODE_ENV: "test",
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5433/task_tracker_test",
      JWT_SECRET: "test-secret-test-secret-test-secret",
      CORS_ORIGINS: "http://localhost:5173",
    },
    setupFiles: ["tests/setup.ts"],
    fileParallelism: false,
  },
});
