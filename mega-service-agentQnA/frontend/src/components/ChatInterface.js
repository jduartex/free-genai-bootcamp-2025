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
      // Use relative URL instead of absolute URL to leverage the proxy setting
      const response = await axios.post('/', { 
        query: currentInput
      });
      
      // Process the response based on the minimal agent's response format
      if (response.data) {
        let agentResponse;
        
        // Handle various response formats from the container
        if (typeof response.data === 'string') {
          agentResponse = response.data;
        } else if (typeof response.data === 'object') {
          agentResponse = response.data.response || 
                        response.data.answer || 
                        response.data.result || 
                        response.data.message || 
                        JSON.stringify(response.data);
        }
        
        setMessages(prevMessages => [
          ...prevMessages, 
          { role: 'agent', content: agentResponse }
        ]);
      } else {
        throw new Error('Empty response from agent container');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: 'agent', content: `Error: ${error.message}. Make sure the agent container is running properly.` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Modify the test function to use relative URLs
  const testEndpoints = async () => {
    setIsLoading(true);
    
    try {
      // Use relative URL instead of absolute URL
      const rootResponse = await axios.get('/');
      let containerInfo = "Container is running. ";
      
      // Include the root response status in the information
      containerInfo += `\n\nRoot endpoint status: ${rootResponse.status}`;
      
      try {
        // Use relative URL instead of absolute URL
        const testQueryResponse = await axios.post('/', { 
          query: "This is a test query. Please respond with your API format." 
        });
        
        containerInfo += `\n\nTest query response: ${JSON.stringify(testQueryResponse.data)}`;
      } catch (err) {
        containerInfo += `\n\nCouldn't test query format: ${err.message}`;
      }
      
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: containerInfo
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'agent', 
        content: 'Could not connect to backend server. Is it running at http://localhost:8000?' 
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
