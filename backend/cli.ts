import { join } from 'path';
import { createInterface } from 'readline';
import { readFile } from 'fs/promises';
import { Client } from 'pg';
import { FeedbackRepo } from './feedback-repo';
import { Utils } from './utils';
import { ulid } from 'ulid';

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
      const embedding = await Utils.openAi.generateTextEmbeddings(JSON.stringify(topics));
      const result = await feedbackRepo.addNewFeedback({ itemText: input, topics, embedding });
      if (!result.success) {
        console.error('Error saving feedback:', result.error.message);
        continue;
      }

      const currentFeedbackId = result.data.feedbackId;
      const similarFeedback = await feedbackRepo.findSimilarFeedback(currentFeedbackId, embedding);
      if (!similarFeedback.success) {
        console.error('Error finding similar feedback:', similarFeedback.error.message);
        continue;
      }

      const similarFeedbackIds = similarFeedback.data.map((f) => f.feedbackId);
      similarFeedbackIds.push(currentFeedbackId);
      const clusteriseResult = await feedbackRepo.clusteriseFeedback(similarFeedbackIds, {
        clusterId: ulid(),
        clusterTitle: `Cluster ${Date.now()}`,
      });

      if (!clusteriseResult.success) {
        console.error('Error clustering feedback:', clusteriseResult.error.message);
        continue;
      }

      console.log('Clustered feedback count:', clusteriseResult.data.updatedCount);
    }
  } catch (error) {
    if (error instanceof Error && error.message !== 'stdin stream closed') console.error('Error:', error);
  } finally {
    rl.close();
    await pgClient.end();
  }
};

main().catch(console.error);
