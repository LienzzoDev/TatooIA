import { customProvider, gateway } from "ai";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  return gateway.languageModel(modelId);
}
