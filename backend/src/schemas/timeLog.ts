import { z } from "zod";

const timestamp = z.iso.datetime({ offset: true });

export const listTimeLogsQuerySchema = z
  .object({
    from: timestamp.optional(),
    to: timestamp.optional(),
    taskId: z.uuid().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .refine((q) => !q.from || !q.to || Date.parse(q.from) < Date.parse(q.to), {
    message: "to must be after from",
    path: ["to"],
  });

export type ListTimeLogsQuery = z.infer<typeof listTimeLogsQuerySchema>;
