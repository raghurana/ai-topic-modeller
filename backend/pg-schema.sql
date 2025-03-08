-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE TOPIC (
    id CHAR(26) PRIMARY KEY,
    group_id INTEGER NULL,
    topic_text TEXT NOT NULL,
    embedding vector(1536) NOT NULL -- vector data
);

CREATE INDEX ON topic USING hnsw (embedding vector_cosine_ops);