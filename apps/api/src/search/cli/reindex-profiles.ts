import { PrismaClient } from '@prisma/client';
import { loadValidatedEnvironment } from '../../config/load-environment';
import { createElasticsearchClient } from '../elasticsearch.client';
import { ProfileIndexManager } from '../profile-index-manager';
import { ProfileReindexer } from '../profile-reindexer';
async function main() {
  loadValidatedEnvironment();
  const prisma = new PrismaClient();
  const client = createElasticsearchClient(
    process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
  );
  try {
    const manager = new ProfileIndexManager(
      client,
      process.env.ELASTICSEARCH_INDEX_ALIAS ?? 'profiles',
    );
    console.log(
      JSON.stringify(
        await new ProfileReindexer(prisma, client, manager).reindex(),
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
