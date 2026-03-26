import { z } from "zod";

const textPartSchema = z.object({
  type: z.enum(["text"]),
  text: z.string().min(1).max(2000),
});

const filePartSchema = z.object({
  type: z.enum(["file"]),
  mediaType: z.string(),
  filename: z.string().optional(),
  url: z.string().min(1),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user"]),
  parts: z.array(partSchema),
});

export const postRequestBodySchema = z.object({
  id: z.string().uuid(),
  message: userMessageSchema,
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
