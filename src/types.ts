
export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
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