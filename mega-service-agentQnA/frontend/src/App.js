import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import FileUpload from './components/FileUpload';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>AgentQnA</h1>
        <div className="tabs">
          <button 
            className={activeTab === 'chat' ? 'active' : ''} 
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          <button 
            className={activeTab === 'upload' ? 'active' : ''} 
            onClick={() => setActiveTab('upload')}
          >
            Upload Documents
          </button>
        </div>
      </header>
      
      <main>
        {activeTab === 'chat' ? (
          <ChatInterface />
        ) : (
          <FileUpload />
        )}
      </main>
      
      <footer>
        <p>AgentQnA - Powered by OPEA</p>
      </footer>
    </div>
  );
}

export default App;
