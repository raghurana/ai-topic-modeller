import { z } from 'zod';
import { generateObject, embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { Client } from 'pg';
import { parse } from 'csv-parse/sync';
import { readFile } from 'fs/promises';

export const Utils = {
  openAi: {
    summariseTopics: async (input: { topics: string[]; model?: string; sysPrompt: string }) => {
      const { topics, model = 'gpt-4o-mini', sysPrompt } = input;
      const { object: summary } = await generateObject({
        model: openai(model, { structuredOutputs: true }),
        system: sysPrompt,
        prompt: topics.join('\n'),
        schemaName: 'summary',
        schemaDescription: 'A summary of the topics.',
        schema: z.object({ summary: z.string() }),
      });
      return summary;
    },
    generateTextEmbeddings: async (inputValues: string[]) => {
      const { values: outputValues, embeddings } = await embedMany({
        model: openai.embedding('text-embedding-3-small'),
        values: inputValues,
      });
      return outputValues.map((value, index) => ({ value, embedding: embeddings[index] }));
    },
  },
  pg: {
    newClient: () => new Client({ connectionString: process.env.DATABASE_URL }),
    toPgVector: (embedding: number[]): string => `[${embedding.join(',')}]`,
  },
  csv: {
    read: async <T>(csvFilePath: string): Promise<T[]> => {
      const data = await readFile(csvFilePath, 'utf-8');
      return parse(data, { columns: true, skip_empty_lines: true });
    },
  },
};
