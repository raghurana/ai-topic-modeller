import { join } from 'path';
import { createInterface } from 'readline';
import { readFile } from 'fs/promises';
import { Utils } from './utils';
import { ulid } from 'ulid';
import { TopicRepo } from './repos/topic-repo';

const pgClient = Utils.pg.newClient();
const topicRepo = new TopicRepo(pgClient);
const cliInput = createInterface({ input: process.stdin, output: process.stdout });

const main = async () => {
  const systemPrompt = await readFile(join(__dirname, 'system-prompt.txt'), 'utf-8');
  await pgClient.connect();

  try {
    const shouldProcessCsvFiles = await new Promise<boolean>((resolve) => {
      cliInput.question('Do you want to read CSV files? (y/n): ', (answer: string) => {
        resolve(answer.toLowerCase() === 'y');
        cliInput.close();
      });
    });

    if (shouldProcessCsvFiles) {
      const testCsvFiles = ['1.csv'];
      for await (const result of readAndSaveCsvTopicsWithEmbeddings(testCsvFiles)) console.log(result);
    } else {
      console.log('Skipping CSV file reading and embedding generation.');
    }

    // console.log('Doing topic modelling for input...');
    // const { topics } = await Utils.openAi.modelTopicsWithGpt({ feedback: input, sysPrompt: systemPrompt });
    // console.log('Topic modelling done.');
    // console.log('Generating embedding for input...');
    // const embedding = await Utils.openAi.generateTextEmbeddings(JSON.stringify(topics));
    // console.log('Embedding generated.');
    // console.log('Saving feedback...');
    // const result = await feedbackRepo.addNewFeedback({ itemText: input, topics, embedding });
    // if (!result.success) {
    //   console.error('Error saving feedback:', result.error.message);
    // }
    // console.log('Feedback saved. Finding similar feedback...');
    // const currentFeedbackId = result.data.feedbackId;
    // const similarFeedback = await feedbackRepo.findSimilarFeedback(currentFeedbackId, embedding);
    // if (!similarFeedback.success) {
    //   console.error('Error finding similar feedback:', similarFeedback.error.message);
    // }
    // if (!similarFeedback.data.length) {
    //   console.warn('No similar feedback found. Skipping clustering.');
    // }
    // console.log('Similar feedback found. Extracting common topics...');
    // const { similarFeedbackIds, similarTopics } = similarFeedback.data.reduce(
    //   (acc, f) => {
    //     acc.similarFeedbackIds.push(f.feedbackId);
    //     acc.similarTopics.push(...f.topics);
    //     return acc;
    //   },
    //   { similarFeedbackIds: [] as number[], similarTopics: [] as string[] },
    // );
    // console.log('Summarising topics...');
    // const summaryResponse = await Utils.openAi.summariseTopics({ topics: similarTopics, sysPrompt: systemPrompt });
    // console.log('Topics summarised.');
    // console.log('Clustering feedback...');
    // const clusteriseResult = await feedbackRepo.clusteriseFeedback([currentFeedbackId, ...similarFeedbackIds], {
    //   clusterId: ulid(),
    //   clusterTitle: summaryResponse.summary,
    // });
    // if (!clusteriseResult.success) {
    //   console.error('Error clustering feedback:', clusteriseResult.error.message);
    // }
    // console.log('Clustered feedback count:', clusteriseResult.data.updatedCount);
    // console.log('--------------------------------');
  } catch (error) {
    if (error instanceof Error && error.message !== 'stdin stream closed') console.error('Error:', error);
  } finally {
    await pgClient.end();
  }
};

const readAndSaveCsvTopicsWithEmbeddings = async function* (
  csvFileNames: string[],
): AsyncGenerator<{ fileName: string; savedCount: number }> {
  for (const csvFileName of csvFileNames) {
    const csvData = await Utils.csv.read<{ topics: string }>(join(__dirname, 'topics', csvFileName));
    const topics = csvData.map((i) => i.topics);

    const topicsWithEmbeddings = await Utils.openAi.generateTextEmbeddings(topics);
    const result = await topicRepo.insertNewTopics(
      topicsWithEmbeddings.map((t) => ({
        id: ulid(),
        topicText: t.value,
        embedding: t.embedding,
      })),
    );

    yield { fileName: csvFileName, savedCount: result.success ? result.data : 0 };
  }
};

main().catch(console.error);
