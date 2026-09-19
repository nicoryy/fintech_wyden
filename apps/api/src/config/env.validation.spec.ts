import { validateEnv } from './env.validation';

const base = {
  JWT_SECRET: 'a-real-secret',
  JWT_REFRESH_SECRET: 'another-real-secret',
};

describe('validateEnv', () => {
  it('passes through a config with both secrets set', () => {
    expect(validateEnv(base)).toBe(base);
  });

  it('throws when JWT_SECRET is missing', () => {
    expect(() =>
      validateEnv({ JWT_REFRESH_SECRET: base.JWT_REFRESH_SECRET }),
    ).toThrow(/JWT_SECRET/);
  });

  it('throws when JWT_REFRESH_SECRET is missing', () => {
    expect(() => validateEnv({ JWT_SECRET: base.JWT_SECRET })).toThrow(
      /JWT_REFRESH_SECRET/,
    );
  });

  it('throws when both are missing', () => {
    expect(() => validateEnv({})).toThrow(/JWT_SECRET.*JWT_REFRESH_SECRET/);
  });

  it('allows the documentation placeholder outside production', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'development',
        JWT_SECRET: 'change-this-secret-in-production',
        JWT_REFRESH_SECRET: 'change-this-refresh-secret-in-production',
      }),
    ).not.toThrow();
  });

  it('refuses the documentation placeholder in production', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'change-this-secret-in-production',
        JWT_REFRESH_SECRET: 'another-real-secret',
      }),
    ).toThrow(/placeholder/);
  });

  it('accepts real secrets in production', () => {
    expect(() =>
      validateEnv({ NODE_ENV: 'production', ...base }),
    ).not.toThrow();
  });
});
