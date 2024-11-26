use crate::llm::LocalLLM;
use ollama_rs::generation::chat::ChatMessage;
use ollama_rs::generation::chat::MessageRole;
use std::vec::Vec;

pub struct ChatState {
    llm: LocalLLM,
    conversation_history: Vec<ChatMessage>,
}

impl ChatState {
    pub fn new() -> Self {
        Self {
            llm: LocalLLM::new("llama3.2".to_string()),
            conversation_history: Vec::new(),
        }
    }

    pub async fn send_message(&mut self, user_message: String) -> Result<String, String> {
        // Add user message to history
        self.conversation_history.push(ChatMessage {
            role: MessageRole::User,
            content: user_message.clone(),
	    images: None
        });

        // Generate response
        let response = self.llm.generate_response(self.conversation_history.clone()).await?;

        // Add AI response to history
        self.conversation_history.push(ChatMessage {
            role: MessageRole::Assistant,
            content: response.clone(),
            images: None
        });

        Ok(response)
    }
}
