import React, { useState } from 'react';
import './ChatInterface.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message to chat
    const userMessage: Message = { role: 'user', content: inputValue };
    setMessages([...messages, userMessage]);
    
    // Clear input field and show loading state
    setInputValue('');
    setIsLoading(true);

    try {
      // Call API to get response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        throw new Error('Something went wrong');
      }

      const data = await response.json();
      
      // Add bot response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h2>Welcome to AgentQnA!</h2>
            <p>Ask me any question about your documents or data.</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-content">
                <strong>{msg.role === 'user' ? 'You:' : 'AgentQnA:'}</strong>
                <p>{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message assistant loading">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !inputValue.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;