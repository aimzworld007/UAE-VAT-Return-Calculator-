const DEVELOPMENT_NODE_ENVS = new Set(['development', 'dev', 'test']);

const isDevEnvironment = (nodeEnv = process.env.NODE_ENV): boolean =>
  !nodeEnv || DEVELOPMENT_NODE_ENVS.has(nodeEnv.toLowerCase());

const readEnvVar = (name: string): string | undefined => {
  const value = process.env[name];
  if (!value) return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const requiredEnvError = (name: string, hint: string): Error =>
  new Error(`[env] Missing required environment variable: ${name}. ${hint}`);

let devOnlyJwtFallbackSecret: string | null = null;

const createDevJwtFallbackSecret = (): string => {
  if (!devOnlyJwtFallbackSecret) {
    // JWT secrets must remain stable while tokens are active. Regenerating a secret invalidates
    // existing signatures and forces re-authentication; effectively it logs users out.
    // We therefore keep one per runtime process in development and never do this in production.
    devOnlyJwtFallbackSecret = `dev-jwt-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  }

  return devOnlyJwtFallbackSecret;
};

export const getJwtSecret = (): string => {
  const explicitSecret = readEnvVar('JWT_SECRET') ?? readEnvVar('JWT_ACCESS_SECRET');
  if (explicitSecret) return explicitSecret;

  if (isDevEnvironment()) {
    return createDevJwtFallbackSecret();
  }

  throw requiredEnvError(
    'JWT_SECRET',
    'Set a long random value in your server environment. Never expose secrets with a VITE_ prefix, because Vite injects VITE_* variables into client bundles.'
  );
};

export const getDatabaseUrl = (): string => {
  const databaseUrl = readEnvVar('DATABASE_URL');
  if (databaseUrl) return databaseUrl;

  throw requiredEnvError(
    'DATABASE_URL',
    'Configure this in your VPS/container environment and local .env files so the PostgreSQL pool can connect during API execution.'
  );
};

export const serverEnv = {
  get isDevelopment() {
    return isDevEnvironment();
  },
  getJwtSecret,
  getDatabaseUrl
};
