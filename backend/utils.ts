import { z } from 'zod';
import { generateObject, embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { TopicModel } from './types';

export const Utils = {
  openAi: {
    modelTopicsWithGpt: async (input: { feedback: string; model?: string; sysPrompt: string }): Promise<TopicModel> => {
      const { feedback, model = 'gpt-4o-mini', sysPrompt } = input;
      const { object: topics } = await generateObject({
        model: openai(model, { structuredOutputs: true }),
        system: sysPrompt,
        prompt: feedback,
        schemaName: 'topics',
        schemaDescription: 'The top 3 topics in the text.',
        schema: z.object({ topics: z.array(z.string()) }),
      });
      return topics;
    },
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
    generateTextEmbeddings: async (text: string) => {
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: text,
      });
      return embedding;
    },
  },
};
