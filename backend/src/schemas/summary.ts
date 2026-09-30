import { z } from "zod";

const timestamp = z.iso.datetime({ offset: true });

export const summaryQuerySchema = z
  .object({ from: timestamp, to: timestamp })
  .refine((range) => Date.parse(range.from) < Date.parse(range.to), {
    message: "to must be after from",
    path: ["to"],
  });

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
