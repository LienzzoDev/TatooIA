export const DEFAULT_CHAT_MODEL = "google/gemini-3-pro-image";

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  {
    id: "google/gemini-3-pro-image",
    name: "Gemini 3 Pro Image",
    provider: "google",
    description: "Image generation model for tattoo previews",
  },
];

export const allowedModelIds = new Set(chatModels.map((m) => m.id));
