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
    const csvData = await Utils.csv.read<{ topics: string }>(csvFileName);
    const topics = csvData.map((i) => i.topics);

    const topicsWithEmbeddings = await Utils.openAi.generateTextEmbeddings(topics);
    const result = await this.topicRepo.insertNewTopics(
      topicsWithEmbeddings.map((t) => ({
        topicText: t.value,
        embedding: t.embedding,
      })),
    );

    return result;
  }
}
