import { z } from "zod";

const title = z.string().trim().min(1).max(200);
const description = z.string().trim().max(2000);

export const createTaskSchema = z.object({
  title,
  description: description.default(""),
});

export const updateTaskSchema = z
  .object({
    title,
    description,
    status: z.enum(["todo", "in_progress", "done"]),
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, "At least one field is required");

export const suggestTaskSchema = z.object({ input: z.string().trim().min(1).max(200) });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
