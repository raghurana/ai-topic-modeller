-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE feedback_items (
    id SERIAL PRIMARY KEY,
    item_text TEXT,
    topics TEXT[],
    embedding vector(1536) -- vector data
);

-- Create an index for semantic search on the embedding column
CREATE INDEX ON feedback_items USING hnsw (embedding vector_cosine_ops);

CREATE TABLE feedback_cluster (
    id SERIAL PRIMARY KEY,
    feedback_ids INTEGER[],
    title TEXT,
    create_date TIMESTAMP,
    update_date TIMESTAMP
);

