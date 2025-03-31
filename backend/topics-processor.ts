import { Client } from 'pg';
import { TopicRepo } from './topic-repo';
import { AsyncResult } from './types';
import { Utils } from './utils';

export class TopicsProcessor {
  private readonly topicRepo: TopicRepo;

  constructor(private readonly aiSystemPrompt: string, readonly pgClient: Client) {
    this.topicRepo = new TopicRepo(pgClient);
  }

  async saveTopicsFromCsv(csvFileName: string): AsyncResult<number> {
    const csvData = await Utils.csv.read<{ topic: string }>(csvFileName);
    const topicsWithEmbeddings = await Utils.openAi.generateTextEmbeddings(csvData.map((row) => row.topic));
    return this.topicRepo.insertNewTopics(
      topicsWithEmbeddings.map((t) => ({
        topicText: t.value,
        embedding: t.embedding,
      })),
    );
  }
}
