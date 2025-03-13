import React from 'react';
import ChatInterface from './components/ChatInterface';
import FileUpload from './components/FileUpload';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <header>
        <h1>AgentQnA Interface</h1>
      </header>
      <main>
        <div className="upload-section">
          <FileUpload />
        </div>
        <div className="chat-section">
          <ChatInterface />
        </div>
      </main>
    </div>
  );
};

export default App;
