import { describe, expect, it } from "vitest";
import { api, signup } from "./helpers";

describe("tasks", () => {
  it("creates, lists, updates and deletes a task", async () => {
    const { auth } = await signup();

    const created = await api().post("/api/tasks").set(auth).send({ title: "Write report" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ title: "Write report", description: "", status: "todo" });
    const url = `/api/tasks/${created.body.id}`;

    expect((await api().get("/api/tasks").set(auth)).body).toHaveLength(1);

    const updated = await api().patch(url).set(auth).send({ status: "done" });
    expect(updated.body).toMatchObject({ title: "Write report", status: "done" });

    expect((await api().delete(url).set(auth)).status).toBe(204);
    expect((await api().get(url).set(auth)).status).toBe(404);
  });

  it("validates input and requires authentication", async () => {
    const { auth } = await signup();
    expect((await api().post("/api/tasks").set(auth).send({ title: " " })).status).toBe(400);
    expect((await api().patch("/api/tasks/not-a-uuid").set(auth).send({ title: "x" })).status).toBe(400);
    expect((await api().get("/api/tasks")).status).toBe(401);
  });

  it("hides one user's tasks from another with 404", async () => {
    const alice = await signup("alice@example.com");
    const bob = await signup("bob@example.com");
    const { body: task } = await api().post("/api/tasks").set(alice.auth).send({ title: "Private" });
    const url = `/api/tasks/${task.id}`;

    expect((await api().get(url).set(bob.auth)).status).toBe(404);
    expect((await api().patch(url).set(bob.auth).send({ title: "Hacked" })).status).toBe(404);
    expect((await api().delete(url).set(bob.auth)).status).toBe(404);
    expect((await api().get("/api/tasks").set(bob.auth)).body).toEqual([]);

    expect((await api().get(url).set(alice.auth)).body.title).toBe("Private");
  });
});
