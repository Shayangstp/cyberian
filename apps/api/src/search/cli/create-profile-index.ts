import { loadValidatedEnvironment } from '../../config/load-environment';
import { createElasticsearchClient } from '../elasticsearch.client';
import { ProfileIndexManager } from '../profile-index-manager';
async function main() {
  loadValidatedEnvironment();
  const client = createElasticsearchClient(
    process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
  );
  try {
    const manager = new ProfileIndexManager(
      client,
      process.env.ELASTICSEARCH_INDEX_ALIAS ?? 'profiles',
    );
    console.log(
      JSON.stringify({ createdIndex: await manager.createIndex() }, null, 2),
    );
  } finally {
    await client.close();
  }
}
void main();
