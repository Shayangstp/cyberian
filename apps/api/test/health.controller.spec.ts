import { Test } from '@nestjs/testing';
import { HealthController } from '../src/modules/health/health.controller';

describe('HealthController', () => {
  it('reports that the service is healthy', async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    const controller = module.get(HealthController);

    expect(controller.getHealth()).toEqual({ status: 'ok' });
  });
});
