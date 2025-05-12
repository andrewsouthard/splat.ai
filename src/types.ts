
export interface MessageAttachment {
    fileType: string;
    contents: string;
}

export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
    attachments?: MessageAttachment[];
    complete: boolean;
    inputTokens?: number;
    tokens?: number;
    tokensPerSecond?: number;
}

export interface Conversation {
    id: string;
    summary: string;
    messages: Message[];
}

export interface Model {
    name: string;
}