import { Client } from 'pg';
import { AsyncResult, UnsavedTopic } from './types';
import { Utils } from './utils';

export class TopicRepo {
  constructor(private readonly connectedClient: Client) {}

  async doAnyTopicsExist(): AsyncResult<boolean> {
    const result = await this.connectedClient.query('SELECT COUNT(*) FROM topic');
    return { success: true, data: result.rows[0].count > 0 };
  }

  async insertNewTopics(topics: UnsavedTopic[]): AsyncResult<number> {
    try {
      if (!topics.length) return { success: true, data: 0 };

      const placeholders = topics.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
      const result = await this.connectedClient.query(
        `INSERT INTO topic (topic_text, embedding) VALUES ${placeholders} RETURNING id`,
        topics.flatMap((t) => [t.topicText, Utils.pg.toPgVector(t.embedding)]),
      );

      return { success: true, data: result.rows.length };
    } catch (e) {
      const ex = e instanceof Error ? e : new Error(String(e));
      return { success: false, error: ex };
    }
  }
}
