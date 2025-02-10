import express from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { FeedbackRepo } from './feedback-repo';
import { Client } from 'pg';

const app = express();
app.use(cors());
app.use(json());

(() => {
  try {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Express Server is running on http://localhost:${port}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

app.get('/', async (req, res) => {
  const pgClient = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await pgClient.connect();
    const feedbackRepo = new FeedbackRepo(pgClient);
    const queryResponse = await feedbackRepo.getAllClusters();
    !queryResponse.success
      ? res.status(500).json({ error: queryResponse.error.message })
      : res.json({ clusters: queryResponse.data });
  } catch (error) {
    console.error('Failed to get clusters:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    await pgClient.end();
  }
});

export default app;
