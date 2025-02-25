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

      console.log('Doing topic modelling for input...');
      const { topics } = await Utils.openAi.modelTopicsWithGpt({ feedback: input, sysPrompt: systemPrompt });
      console.log('Topic modelling done.');

      console.log('Generating embedding for input...');
      const embedding = await Utils.openAi.generateTextEmbeddings(JSON.stringify(topics));
      console.log('Embedding generated.');

      console.log('Saving feedback...');
      const result = await feedbackRepo.addNewFeedback({ itemText: input, topics, embedding });
      if (!result.success) {
        console.error('Error saving feedback:', result.error.message);
        continue;
      }

      console.log('Feedback saved. Finding similar feedback...');
      const currentFeedbackId = result.data.feedbackId;
      const similarFeedback = await feedbackRepo.findSimilarFeedback(currentFeedbackId, embedding);
      if (!similarFeedback.success) {
        console.error('Error finding similar feedback:', similarFeedback.error.message);
        continue;
      }

      if (!similarFeedback.data.length) {
        console.warn('No similar feedback found. Skipping clustering.');
        continue;
      }

      console.log('Similar feedback found. Extracting common topics...');
      const { similarFeedbackIds, similarTopics } = similarFeedback.data.reduce(
        (acc, f) => {
          acc.similarFeedbackIds.push(f.feedbackId);
          acc.similarTopics.push(...f.topics);
          return acc;
        },
        { similarFeedbackIds: [] as number[], similarTopics: [] as string[] },
      );

      console.log('Summarising topics...');
      const summaryResponse = await Utils.openAi.summariseTopics({ topics: similarTopics, sysPrompt: systemPrompt });
      console.log('Topics summarised.');

      console.log('Clustering feedback...');
      const clusteriseResult = await feedbackRepo.clusteriseFeedback([currentFeedbackId, ...similarFeedbackIds], {
        clusterId: ulid(),
        clusterTitle: summaryResponse.summary,
      });

      if (!clusteriseResult.success) {
        console.error('Error clustering feedback:', clusteriseResult.error.message);
        continue;
      }

      console.log('Clustered feedback count:', clusteriseResult.data.updatedCount);
      console.log('--------------------------------');
    }
  } catch (error) {
    if (error instanceof Error && error.message !== 'stdin stream closed') console.error('Error:', error);
  } finally {
    rl.close();
    await pgClient.end();
  }
};

main().catch(console.error);
