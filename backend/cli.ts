import { join } from 'path';
import { createInterface } from 'readline';
import { readFile } from 'fs/promises';
import { Client } from 'pg';
import { FeedbackRepo } from './feedback-repo';
import { Utils } from './utils';

const main = async () => {
  const pgClient = new Client({ connectionString: process.env.DATABASE_URL });
  const feedbackRepo = new FeedbackRepo(pgClient);
  const systemPrompt = await readFile(join(__dirname, 'system-prompt.txt'), 'utf-8');

  await pgClient.connect();
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'Enter your question (Ctrl+C to exit): ',
  });

  try {
    while (true) {
      rl.prompt();
      const input = await new Promise<string>((res) => rl.once('line', res));
      const { topics } = await Utils.openAi.modelTopicsWithGpt({ feedback: input, sysPrompt: systemPrompt });
      const embedding = await Utils.openAi.generateTextEmbeddings(input);
      const result = await feedbackRepo.saveFeedback({ itemText: input, topics, embedding });

      result.success
        ? console.log(`Feedback saved with ID: ${result.data.feedbackId}`)
        : console.error('Error saving feedback:', result.error.message);
    }
  } catch (error) {
    if (error instanceof Error && error.message !== 'stdin stream closed') console.error('Error:', error);
  } finally {
    rl.close();
    await pgClient.end();
  }
};

main().catch(console.error);
