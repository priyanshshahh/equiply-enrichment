import { ALLOWED_MODELS, DEFAULT_MODEL, type AllowedModel } from "./openaiFallback";

/** Trim key from Vite env (handles accidental spaces after `=` in .env). */
export function getOpenAiKeyFromEnv(): string {
  const raw = import.meta.env.VITE_OPENAI_API_KEY;
  if (typeof raw !== "string") return "";
  return raw.trim();
}

export function isAllowedModel(value: string): value is AllowedModel {
  return (ALLOWED_MODELS as readonly string[]).includes(value);
}

export function resolveModel(preferred?: string): AllowedModel {
  if (preferred && isAllowedModel(preferred)) return preferred;
  return DEFAULT_MODEL;
}

/** Hackathon-only models — reject anything else before an API call. */
export function assertAllowedModel(model: string): asserts model is AllowedModel {
  if (!isAllowedModel(model)) {
    throw new Error(
      `Model "${model}" is not allowed. Use one of: ${ALLOWED_MODELS.join(", ")}`
    );
  }
}
