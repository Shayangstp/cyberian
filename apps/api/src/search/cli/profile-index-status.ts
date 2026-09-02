import { PrismaClient } from '@prisma/client';
import { loadValidatedEnvironment } from '../../config/load-environment';
import { createElasticsearchClient } from '../elasticsearch.client';
import { ProfileIndexManager } from '../profile-index-manager';
async function main() {
  loadValidatedEnvironment();
  const prisma = new PrismaClient();
  const client = createElasticsearchClient(
    process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
  );
  try {
    const status = await new ProfileIndexManager(
      client,
      process.env.ELASTICSEARCH_INDEX_ALIAS ?? 'profiles',
    ).status();
    const postgresCount = await prisma.profile.count();
    console.log(
      JSON.stringify(
        {
          ...status,
          postgresCount,
          countMatch: status.elasticsearchCount === postgresCount,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
    await client.close();
  }
}
void main();
