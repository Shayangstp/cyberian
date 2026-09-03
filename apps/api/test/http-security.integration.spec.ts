import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Express } from 'express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureHttpApp } from '../src/bootstrap/configure-http-app';
import { PrismaService } from '../src/database/prisma.service';
import { ELASTICSEARCH_CLIENT } from '../src/search/search.module';
import { expectNoPublicPii } from './public-response-pii.assertion';

const frontendOrigin = 'http://frontend.example.test';
const baseEnvironment = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  WEB_ORIGIN: frontendOrigin,
  ELASTICSEARCH_URL: 'http://elasticsearch.internal:9200',
  ELASTICSEARCH_INDEX_ALIAS: 'profiles_public',
  REQUEST_SIZE_LIMIT: '100kb',
  RATE_LIMIT_MAX: '100',
  RATE_LIMIT_WINDOW_MS: '60000',
};

type SearchMock = { search: jest.Mock };

function http(app: INestApplication) {
  return request(app.getHttpServer() as Express);
}

async function createHttpApp(
  search: SearchMock,
  environment: Record<string, string> = {},
): Promise<INestApplication> {
  const values = { ...baseEnvironment, ...environment };
  const previous = new Map(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, values);
  try {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ELASTICSEARCH_CLIENT)
      .useValue(search)
      .overrideProvider(PrismaService)
      .useValue({ onModuleInit: jest.fn(), onModuleDestroy: jest.fn() })
      .compile();
    const app = module.createNestApplication({ bodyParser: false });
    app.useLogger(false);
    configureHttpApp(app);
    await app.init();
    return app;
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function successfulSearchResponse() {
  return {
    took: 1,
    hits: {
      total: { value: 1 },
      hits: [
        {
          _index: 'profiles-physical-2026',
          _score: 99,
          _source: {
            id: 'synthetic-profile',
            fullName: 'Synthetic Profile',
            jobTitle: 'Engineer',
            currentCompanyName: 'Example Co',
            industry: 'Technology',
            locationName: 'Test City',
            country: 'US',
            summary: 'Synthetic fixture only',
            skills: ['TypeScript'],
            linkedinUrl: 'https://www.linkedin.com/in/synthetic',
            phone: '+1-555-0100',
            mobile: '+1-555-0101',
            email: 'private@example.test',
            address: '1 Private Way',
            street: 'Private Way',
            postalCode: '00000',
            birthDate: '1990-01-01',
            facebook: 'private-facebook',
            twitter: 'private-twitter',
            github: 'private-github',
            sourceKey: 'private-source-key',
            linkedInInternalId: 'private-linkedin-id',
          },
        },
      ],
    },
  };
}

function analyticsResponse() {
  return {
    hits: {
      total: { value: 1 },
      hits: [{ _source: successfulSearchResponse().hits.hits[0]!._source }],
    },
    aggregations: {
      uniqueIndustries: { value: 1 },
      uniqueSkills: { value: 1 },
      uniqueCountries: { value: 1 },
      topIndustries: { buckets: [{ key: 'Technology', doc_count: 1 }] },
      topSkills: { buckets: [{ key: 'TypeScript', doc_count: 1 }] },
      countries: { buckets: [{ key: 'US', doc_count: 1 }] },
    },
  };
}

describe('HTTP security integration', () => {
  let app: INestApplication;
  let search: SearchMock;

  beforeEach(async () => {
    search = {
      search: jest.fn().mockResolvedValue(successfulSearchResponse()),
    };
    app = await createHttpApp(search);
  });

  afterEach(async () => {
    await app.close();
  });

  it('applies Helmet headers without changing health success', async () => {
    const response = await http(app).get('/api/health').expect(200);

    expect(response.headers['x-content-type-options']).toBeDefined();
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['referrer-policy']).toBeDefined();
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('allows the configured CORS origin but never uses a wildcard', async () => {
    const response = await http(app)
      .get('/api/health')
      .set('Origin', frontendOrigin)
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe(
      frontendOrigin,
    );
    expect(response.headers['access-control-allow-origin']).not.toBe('*');
  });

  it('does not permit an unknown CORS origin', async () => {
    const response = await http(app)
      .get('/api/health')
      .set('Origin', 'https://untrusted.example')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('continues to serve requests with no Origin header', async () => {
    await http(app).get('/api/health').expect(200).expect({ status: 'ok' });
  });

  it('handles configured-origin CORS preflight without reflecting arbitrary origins', async () => {
    const response = await http(app)
      .options('/api/profiles/search')
      .set('Origin', frontendOrigin)
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Content-Type, Authorization')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe(
      frontendOrigin,
    );
    expect(response.headers['access-control-allow-methods']).toContain('GET');
    expect(response.headers['access-control-allow-headers']).toContain(
      'Content-Type',
    );
    expect(response.headers['access-control-allow-headers']).toContain(
      'Authorization',
    );
  });

  it('rejects invalid and unknown search query parameters without internal details', async () => {
    for (const query of ['limit=11', 'unexpected=value']) {
      const response = await http(app)
        .get(`/api/profiles/search?${query}`)
        .expect(400);
      expect(JSON.stringify(response.body)).not.toMatch(/stack|Error:/i);
    }
  });

  it('rejects JSON bodies over the configured 100kb limit before routing', async () => {
    const submittedBody = 'not-for-response'.repeat(10_000);
    const response = await http(app)
      .get('/api/health')
      .set('Content-Type', 'application/json')
      .send({ submittedBody })
      .expect(413);

    expect(JSON.stringify(response.body)).not.toContain(submittedBody);
    expect(JSON.stringify(response.body)).not.toMatch(
      /stack|PayloadTooLargeError/i,
    );
  });

  it('maps Elasticsearch failures to a generic 503 response', async () => {
    search.search.mockRejectedValueOnce(
      new Error(
        'ECONNREFUSED elasticsearch.internal:9200 profiles_public profiles-physical-2026',
      ),
    );
    const response = await http(app)
      .get('/api/profiles/search?q=engineer')
      .expect(503);
    const publicResponse = JSON.stringify(response.body);

    expect(response.body).toMatchObject({
      message: 'Profile search is temporarily unavailable',
    });
    expect(publicResponse).not.toMatch(
      /elasticsearch\.internal|profiles_public|profiles-physical-2026|ECONNREFUSED|stack/i,
    );
  });

  it('does not expose PII or Elasticsearch internals in search and analytics HTTP responses', async () => {
    const searchResponse = await http(app)
      .get('/api/profiles/search')
      .expect(200);
    expectNoPublicPii(searchResponse.body);

    search.search.mockResolvedValueOnce(analyticsResponse());
    const analytics = await http(app)
      .get('/api/profiles/analytics')
      .expect(200);
    expectNoPublicPii(analytics.body);
  });
});

describe('HTTP rate-limit integration', () => {
  it('returns 429 after a low, isolated test limit', async () => {
    const app = await createHttpApp(
      { search: jest.fn().mockResolvedValue(successfulSearchResponse()) },
      { RATE_LIMIT_MAX: '2', RATE_LIMIT_WINDOW_MS: '60000' },
    );
    try {
      const server = http(app);
      await server.get('/api/profiles/search').expect(200);
      await server.get('/api/profiles/search').expect(200);
      await server.get('/api/profiles/search').expect(429);
    } finally {
      await app.close();
    }
  });
});
