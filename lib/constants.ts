export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
  process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

export const suggestions = [
  "Quiero ver cómo queda un tatuaje de rosa en mi muñeca",
  "Preview de un tatuaje geométrico en el antebrazo",
  "Cómo se vería un dragón en mi hombro",
  "Tatuaje minimalista en el tobillo",
];
