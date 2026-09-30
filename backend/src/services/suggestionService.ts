import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { config } from "../config";
import { AppError } from "../errors";

const suggestionSchema = z.object({ title: z.string(), description: z.string() });

const SYSTEM_PROMPT =
  "Turn a rough task note into a clear task. Give a specific title of at most 10 words and a one or two " +
  "sentence description naming the concrete next action. Do not invent details the note doesn't imply.";

const client = config.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: config.ANTHROPIC_API_KEY }) : null;

export async function suggest(input: string) {
  if (!client) throw new AppError(503, "AI suggestions are not configured");
  try {
    const response = await client.messages.parse({
      model: config.AI_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(suggestionSchema) },
      messages: [{ role: "user", content: input }],
    });
    if (response.parsed_output) return response.parsed_output;
  } catch (err) {
    if (!(err instanceof Anthropic.APIError)) throw err;
  }
  throw new AppError(502, "Could not generate a suggestion");
}
