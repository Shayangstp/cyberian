import { resolve } from 'node:path';
import { rootEnvironmentFilePath } from '../src/config/environment-file';
import { environmentValidationSchema } from '../src/config/environment.validation';

describe('environment validation', () => {
  it('resolves the environment file from the repository root', () => {
    expect(rootEnvironmentFilePath).toBe(resolve(__dirname, '../../../.env'));
  });

  it('accepts and normalizes the supported backend configuration', () => {
    const result = environmentValidationSchema.validate({
      NODE_ENV: 'test',
      API_PORT: '4100',
      WEB_ORIGIN: 'http://localhost:5173',
      DATABASE_URL:
        'postgresql://application:development@localhost:5432/application',
    });

    expect(result.error).toBeUndefined();
    expect(result.value).toMatchObject({
      NODE_ENV: 'test',
      API_PORT: 4100,
      WEB_ORIGIN: 'http://localhost:5173',
      DATABASE_URL:
        'postgresql://application:development@localhost:5432/application',
    });
  });

  it('rejects a missing database URL', () => {
    const result = environmentValidationSchema.validate({
      NODE_ENV: 'test',
      API_PORT: 4100,
      WEB_ORIGIN: 'http://localhost:5173',
    });

    expect(result.error).toBeDefined();
  });

  it('rejects invalid security limits and accepts positive configured limits', () => {
    const base = {
      DATABASE_URL:
        'postgresql://application:development@localhost:5432/application',
    };
    expect(
      environmentValidationSchema.validate({ ...base, RATE_LIMIT_MAX: 0 })
        .error,
    ).toBeDefined();
    expect(
      environmentValidationSchema.validate({
        ...base,
        RATE_LIMIT_WINDOW_MS: -1,
      }).error,
    ).toBeDefined();
    expect(
      environmentValidationSchema.validate({
        ...base,
        REQUEST_SIZE_LIMIT: '100kb',
      }).error,
    ).toBeUndefined();
  });
});
