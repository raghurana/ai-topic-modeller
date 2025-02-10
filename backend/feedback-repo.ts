import { Client } from 'pg';
import { Feedback, FeedbackCluster, Result } from './types';

export class FeedbackRepo {
  constructor(private readonly connectedClient: Client) {}

  async saveFeedback(feedback: Feedback): Promise<Result<{ feedbackId: number }>> {
    try {
      const result = await this.connectedClient.query(
        'INSERT INTO feedback_items (item_text, topics, embedding) VALUES ($1, $2, $3) RETURNING id',
        [feedback.itemText, feedback.topics, `[${feedback.embedding.join(',')}]`],
      );
      return { success: true, data: { feedbackId: result.rows[0].id } };
    } catch (e) {
      const ex = e instanceof Error ? e : new Error(String(e));
      return { success: false, error: ex };
    }
  }

  async getAllClusters(): Promise<Result<FeedbackCluster[]>> {
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
}
