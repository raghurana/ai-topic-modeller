export type TopicModel = {
  topics: string[];
};

export type Feedback = {
  itemText: string;
  topics: string[];
  embedding: number[];
};

export type FeedbackCluster = {
  id: number;
  title: string;
  feedbackTexts: string[];
  createDate: Date;
  updateDate: Date;
};

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
