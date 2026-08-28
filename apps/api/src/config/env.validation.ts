/**
 * Placeholder secrets shipped in .env.example / docker-compose.yml for local
 * convenience. They must never reach a production boot.
 */
const INSECURE_JWT_DEFAULTS = new Set([
  'change-this-secret-in-production',
  'change-this-refresh-secret-in-production',
]);

const REQUIRED_KEYS = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];

/**
 * `ConfigModule.forRoot({ validate })` — fails the boot fast instead of
 * letting the API start with an unset or publicly-known JWT secret.
 * `JWT_SECRET`/`JWT_REFRESH_SECRET` must always be present (no more silent
 * `config.get(key, 'change-this-secret-in-production')` fallbacks); in
 * production they additionally can't be the placeholder value.
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_KEYS.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}`,
    );
  }

  if (config.NODE_ENV === 'production') {
    const insecure = REQUIRED_KEYS.filter((key) =>
      INSECURE_JWT_DEFAULTS.has(String(config[key])),
    );
    if (insecure.length > 0) {
      throw new Error(
        `Refusing to boot with the placeholder secret value for: ` +
          `${insecure.join(', ')}. Set a real secret (e.g. \`openssl rand -hex 32\`).`,
      );
    }
  }

  return config;
}
