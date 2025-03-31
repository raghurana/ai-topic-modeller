import { join } from 'path';
import { readFile } from 'fs/promises';
import { Utils } from './utils';
import { TopicsProcessor } from './topics-processor';

const pgClient = Utils.pg.newClient();

const main = async () => {
  await pgClient.connect();
  const testCsvFile = join(__dirname, '_csv', '01-topics.csv');
  const systemPrompt = await readFile(join(__dirname, 'system-prompt.txt'), 'utf-8');
  const topicsProcessor = new TopicsProcessor(systemPrompt, pgClient);

  try {
    const result = await topicsProcessor.saveTopicsFromCsv(testCsvFile);
    console.log(result);
  } catch (error) {
    if (error instanceof Error && error.message !== 'stdin stream closed') console.error('Error:', error);
  } finally {
    await pgClient.end();
  }
};

main().catch(console.error);
