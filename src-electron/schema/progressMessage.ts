import {
  FlattenMessages,
  MessageContent,
  MessageTranslation,
} from '../util/message/base';

type HProgressMessage = {
  java: {
    download: MessageContent;
    next: MessageContent<{ a: number; b: string }>;
  };
};

export type ProgressMessage = FlattenMessages<HProgressMessage>;

export type ProgressMessageTranslation = MessageTranslation<HProgressMessage>;
