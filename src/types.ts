
export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    complete: boolean;
}

export interface Conversation {
    id: string;
    summary: string;
    messages: Message[];
}

export interface Model {
    name: string;
}