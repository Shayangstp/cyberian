import { Client } from '@elastic/elasticsearch';
export function createElasticsearchClient(url: string): Client {
  return new Client({ node: url });
}
