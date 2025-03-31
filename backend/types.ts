export type Result<T> =
  | {
      success: true;
      data: T;
      error?: never;
    }
  | {
      success: false;
      data?: never;
      error: Error;
    };

export type AsyncResult<T> = Promise<Result<T>>;

export type Topic = {
  id: number;
  topicText: string;
  embedding: number[];
};

export type MergedTopic = {
  id: number;
  topicText: string;
  centroidEmbedding: number[];
};

export type TopicMerge = {
  individualTopicId: number;
  mergedTopicId: number;
};

export type UnsavedTopic = Omit<Topic, 'id'>;

export type UnsavedMergedTopic = Omit<MergedTopic, 'id'>;
