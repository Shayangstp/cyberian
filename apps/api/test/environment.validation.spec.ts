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
    });

    expect(result.error).toBeUndefined();
    expect(result.value).toMatchObject({
      NODE_ENV: 'test',
      API_PORT: 4100,
      WEB_ORIGIN: 'http://localhost:5173',
    });
  });
});
