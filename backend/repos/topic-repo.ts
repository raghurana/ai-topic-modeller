import { Client } from 'pg';
import { AsyncResult, Topic } from '../types';

export class TopicRepo {
  constructor(private readonly connectedClient: Client) {}

  async addNewTopics(topics: Topic[]): AsyncResult<number> {
    try {
      if (!topics.length) return { success: true, data: 0 };

      const placeholders = topics
        .map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`)
        .join(', ');

      const result = await this.connectedClient.query(
        `INSERT INTO topic (id, topic_text, embedding, group_id) VALUES ${placeholders} RETURNING id`,
        topics.flatMap((t) => [t.id, t.topicText, this.toPgVector(t.embedding), t.groupId || null]),
      );

      return { success: true, data: result.rows.length };
    } catch (e) {
      const ex = e instanceof Error ? e : new Error(String(e));
      return { success: false, error: ex };
    }
  }

  private toPgVector(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }
}
