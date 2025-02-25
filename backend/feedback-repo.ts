import { Client } from 'pg';
import { Feedback, FeedbackCluster, Result, AsyncResult } from './types';

export class FeedbackRepo {
  constructor(private readonly connectedClient: Client) {}

  async addNewFeedback(feedback: Feedback): AsyncResult<{ feedbackId: number }> {
    try {
      const embeddingPgVector = this.toPgVector(feedback.embedding);
      const result = await this.connectedClient.query(
        'INSERT INTO feedback_items (item_text, topics, embedding, created_date, last_update_date) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id',
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
  ): AsyncResult<{ feedbackId: number; topics: string[]; cosineDistance: number }[]> {
    try {
      const embeddingPgVector = this.toPgVector(feedbackEmbedding);
      const result = await this.connectedClient.query(
        'SELECT id, topics, embedding <=> $1 AS cosine_distance FROM feedback_items WHERE id <> $2 AND embedding <=> $1 < $3 ORDER BY cosine_distance',
        [embeddingPgVector, feedbackId, similarityThresh],
      );
      return {
        success: true,
        data:
          result.rows?.map((r) => ({
            feedbackId: r.id,
            topics: r.topics,
            cosineDistance: r.cosine_distance,
          })) ?? [],
      };
    } catch (e) {
      const ex = e instanceof Error ? e : new Error(String(e));
      return { success: false, error: ex };
    }
  }

  async clusteriseFeedback(
    feedbackIds: number[],
    updates: { clusterId: string; clusterTitle: string },
  ): AsyncResult<{ updatedCount: number }> {
    try {
      if (!feedbackIds?.length) return { success: true, data: { updatedCount: 0 } };

      const idPlaceholders = feedbackIds.map((_, idx) => `$${idx + 3}`).join(',');
      const query = `UPDATE feedback_items SET cluster_id = $1, cluster_title = $2, last_update_date = CURRENT_TIMESTAMP WHERE id IN (${idPlaceholders}) RETURNING id`;
      const values = [updates.clusterId, updates.clusterTitle, ...feedbackIds];
      const result = await this.connectedClient.query(query, values);

      return {
        success: true,
        data: { updatedCount: result.rowCount ?? 0 },
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
          fi.cluster_id as "id",
          fi.cluster_title as "title",
          MIN(fi.created_date) as "createDate",
          MAX(fi.last_update_date) as "updateDate",
          array_agg(fi.item_text) as "feedbackTexts"
        FROM feedback_items fi
        WHERE fi.cluster_id IS NOT NULL
        GROUP BY fi.cluster_id, fi.cluster_title
        ORDER BY MIN(fi.created_date) DESC
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
