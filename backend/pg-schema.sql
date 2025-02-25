-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE feedback_items (
    id SERIAL PRIMARY KEY,
    item_text TEXT,
    topics TEXT[],
    embedding vector(1536), -- vector data
    cluster_id TEXT NULL, -- ULID provided from repo code, optional
    cluster_title TEXT NULL, -- optional
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create an index for semantic search on the embedding column
CREATE INDEX ON feedback_items USING hnsw (embedding vector_cosine_ops);

