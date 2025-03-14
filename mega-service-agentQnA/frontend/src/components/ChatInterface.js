import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatInterface.css';

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Updated for full agent which likely supports proper POST to /api/chat
      const response = await axios.post('/api/chat', { 
        messages: [{ role: 'user', content: currentInput }]
      });
      
      // Full agent should return a proper response format
      if (response.data && response.data.response) {
        setMessages(prevMessages => [
          ...prevMessages, 
          { role: 'agent', content: response.data.response }
        ]);
      } else if (response.data && response.data.message) {
        setMessages(prevMessages => [
          ...prevMessages, 
          { 
            role: response.data.message.role || 'agent', 
            content: response.data.message.content 
          }
        ]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: 'agent', content: `Error: ${error.message}. Make sure the full agent service is running properly.` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Updated test function to test full agent endpoints
  const testEndpoints = async () => {
    setIsLoading(true);
    
    try {
      // Test both health and API endpoints that should be available in full agent
      const endpoints = [
        '/health',
        '/api/health',
        '/api/chat',
        '/api/query'
      ];
      const results = [];
      
      for (const endpoint of endpoints) {
        try {
          const resp = await axios.get(endpoint);
          results.push(`✅ GET ${endpoint} - Status: ${resp.status}`);
        } catch (err) {
          results.push(`❌ GET ${endpoint} - Error: ${err.response?.status || err.message}`);
        }
      }
      
      // Try a POST request to /api/chat
      try {
        const chatResp = await axios.post('/api/chat', { 
          messages: [{ role: 'user', content: 'Test message' }] 
        });
        results.push(`✅ POST /api/chat - Status: ${chatResp.status}`);
      } catch (err) {
        results.push(`❌ POST /api/chat - Error: ${err.response?.status || err.message}`);
      }
      
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: `Full Agent API Test Results:\n\n${results.join('\n')}`
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: 'Could not connect to full agent server. Did you run the launch_agent_service_openai.sh script?' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h2>Welcome to AgentQnA</h2>
            <p>Ask me anything about your data!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message agent">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="input-form">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
        <button 
          type="button" 
          onClick={testEndpoints} 
          disabled={isLoading}
          className="test-button"
        >
          Test API
        </button>
      </form>
    </div>
  );
}

export default ChatInterface;
