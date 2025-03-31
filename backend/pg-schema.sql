-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for individual topics
CREATE TABLE topic (
    id bigserial PRIMARY KEY,
    topic_text text NOT NULL,
    embedding vector(1536) NOT NULL
);

-- Table for merged topics
CREATE TABLE merged_topic (
    id bigserial PRIMARY KEY,
    topic_text text NOT NULL,
    embedding vector(1536) NOT NULL
);

-- Table for mapping individual topics to merged topics
CREATE TABLE topic_merges (
    individual_topic_id bigint REFERENCES topic(id),
    merged_topic_id bigint REFERENCES merged_topic(id),
    PRIMARY KEY (individual_topic_id)
);

-- Create an index for semantic search on the embedding column
CREATE INDEX ON topic USING hnsw (embedding vector_cosine_ops);