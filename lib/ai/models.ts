export const DEFAULT_CHAT_MODEL = "google/gemini-3.1-flash-image-preview";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "google/gemini-3.1-flash-image-preview",
    name: "Gemini 3.1 Flash Image Preview",
    provider: "google",
    description: "Fast image generation model for tattoo previews",
  },
];

export const allowedModelIds = new Set(chatModels.map((m) => m.id));
