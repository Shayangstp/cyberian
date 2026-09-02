import Joi from 'joi';

export const environmentValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  API_PORT: Joi.number().port().default(3000),
  WEB_ORIGIN: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:5173'),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  ELASTICSEARCH_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:9200'),
  ELASTICSEARCH_INDEX_ALIAS: Joi.string()
    .pattern(/^[a-z][a-z0-9_-]*$/)
    .default('profiles'),
});
