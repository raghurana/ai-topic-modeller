import { Client } from 'pg';
import { AsyncResult, Topic } from '../types';
import { Utils } from '../utils';

export class TopicRepo {
  constructor(private readonly connectedClient: Client) {}

  async insertNewTopics(topics: Topic[]): AsyncResult<number> {
    try {
      if (!topics.length) return { success: true, data: 0 };

      const placeholders = topics.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ');
      const result = await this.connectedClient.query(
        `INSERT INTO topic (id, topic_text, embedding) VALUES ${placeholders} RETURNING id`,
        topics.flatMap((t) => [t.id, t.topicText, Utils.pg.toPgVector(t.embedding)]),
      );

      return { success: true, data: result.rows.length };
    } catch (e) {
      const ex = e instanceof Error ? e : new Error(String(e));
      return { success: false, error: ex };
    }
  }

  async findSimilarTopicsWithCosine(
    topicId: string,
    embedding: number[],
    similarityThresh: number = 0.5,
  ): AsyncResult<{ topicId: string; topicText: string; cosineDistance: number }[]> {
    try {
      const embeddingPgVector = Utils.pg.toPgVector(embedding);
      const result = await this.connectedClient.query(
        'SELECT id, topic_text, embedding <=> $1 AS cosine_distance FROM topic WHERE id <> $2 AND embedding <=> $1 < $3 ORDER BY cosine_distance',
        [embeddingPgVector, topicId, similarityThresh],
      );

      return {
        success: true,
        data:
          result.rows?.map((r) => ({
            topicId: r.id,
            topicText: r.topic_text,
            cosineDistance: r.cosine_distance,
          })) ?? [],
      };
    } catch (e) {
      const ex = e instanceof Error ? e : new Error(String(e));
      return { success: false, error: ex };
    }
  }
}
