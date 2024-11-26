use ollama_rs::{
    Ollama,
    generation::chat::{
        request::ChatMessageRequest,
        ChatMessage,
        MessageRole,
    }
};

pub struct LocalLLM {
    client: Ollama,
    model: String,
}

impl LocalLLM {
    pub fn new(model: String) -> Self {
        let client = Ollama::default();
        Self { client, model }
    }

    pub async fn generate_response(&self, messages: Vec<ChatMessage>) -> Result<String, String> {
        let request = ChatMessageRequest::new(
            self.model.clone(), 
            messages
        );

        match self.client.send_chat_messages(request).await {
           // Ok(response) => Ok(response.message.content),
	    Ok(response) => Ok(response.message.unwrap().content),

            Err(e) => Err(format!("LLM generation error: {}", e))
        }
    }
}
