// filepath: /Users/jduarte/Documents/GenAIBootcamp/free-genai-bootcamp-2025/opea-comps/frontend-react/src/ModelInteraction.js
import React, { useState } from 'react';
import axios from 'axios';

const ModelInteraction = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8008/api/generate', {
        model: 'llama3.2:1B',
        prompt: question,
      });
      setResponse(res.data);
    } catch (error) {
      console.error('Error fetching response:', error);
      setResponse('Error fetching response');
    }
  };

  return (
    <div>
      <h1>Ask the Model</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your question"
        />
        <button type="submit">Ask</button>
      </form>
      <div>
        <h2>Response:</h2>
        <p>{response}</p>
      </div>
    </div>
  );
};

export default ModelInteraction;