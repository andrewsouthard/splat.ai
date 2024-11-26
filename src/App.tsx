import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core'
import { 
  Send, 
  RefreshCcw, 
  User, 
  Bot, 
  ChevronUp, 
  ChevronDown 
} from 'lucide-react';
import Markdown from 'react-markdown'

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await invoke('send_message', { message: inputMessage });
      
      const aiMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Message send error:', error);
      // Handle error UI
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Chat Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex items-start space-x-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <Bot className="w-8 h-8 text-blue-500" />
            )}
            <div 
              className={`
                px-4 py-2 rounded-xl max-w-[70%]
                ${msg.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-800 border'}
              `}
            >

              <Markdown>{msg.content}</Markdown>
            </div>
            {msg.role === 'user' && (
              <User className="w-8 h-8 text-gray-500" />
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t">
        <div className="flex items-center space-x-2">
          <input 
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-grow p-2 border rounded-lg"
          />
          <button 
            onClick={sendMessage}
            disabled={isLoading}
            className="p-2 bg-blue-500 text-white rounded-full disabled:opacity-50"
          >
            {isLoading ? <RefreshCcw className="animate-spin" /> : <Send />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
