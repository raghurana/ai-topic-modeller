import { Client } from 'pg';
import { Feedback, FeedbackCluster, Result, AsyncResult } from './types';

export class FeedbackRepo {
  constructor(private readonly connectedClient: Client) {}

  async saveFeedback(feedback: Feedback): AsyncResult<{ feedbackId: number }> {
    try {
      const embeddingPgVector = this.toPgVector(feedback.embedding);
      const result = await this.connectedClient.query(
        'INSERT INTO feedback_items (item_text, topics, embedding) VALUES ($1, $2, $3) RETURNING id',
        [feedback.itemText, feedback.topics, embeddingPgVector],
      );
      return { success: true, data: { feedbackId: result.rows[0].id } };
    } catch (e) {
      const ex = e instanceof Error ? e : new Error(String(e));
      return { success: false, error: ex };
    }
  }

  async findSimilarFeedback(
    feedbackId: number,
    feedbackEmbedding: number[],
    similarityThresh: number = 0.5,
  ): AsyncResult<{ feedbackId: number; cosineDistance: number }[]> {
    try {
      const embeddingPgVector = this.toPgVector(feedbackEmbedding);
      const result = await this.connectedClient.query(
        'SELECT id, embedding <=> $1 AS cosine_distance FROM feedback_items WHERE id <> $2 AND embedding <=> $1 < $3 ORDER BY cosine_distance',
        [embeddingPgVector, feedbackId, similarityThresh],
      );
      return {
        success: true,
        data: result.rows as { feedbackId: number; cosineDistance: number }[],
      };
    } catch (e) {
      const ex = e instanceof Error ? e : new Error(String(e));
      return { success: false, error: ex };
    }
  }

  async getAllClusters(): AsyncResult<FeedbackCluster[]> {
    try {
      const result = await this.connectedClient.query(`
        SELECT 
          fc.id,
          fc.title,
          fc.create_date as "createDate",
          fc.update_date as "updateDate",
          array_agg(fi.item_text) as "feedbackTexts"
        FROM feedback_cluster fc
        LEFT JOIN feedback_items fi ON fi.id = ANY(fc.feedback_ids) 
        GROUP BY fc.id, fc.title, fc.create_date, fc.update_date
      `);

      return {
        success: true,
        data: result.rows as FeedbackCluster[],
      };
    } catch (e) {
      const ex = e instanceof Error ? e : new Error(String(e));
      return { success: false, error: ex };
    }
  }

  private toPgVector(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }
}
