import React, { useState, useEffect } from 'react';
import { QrCode } from 'lucide-react';
import QRGenerator from './components/QRGenerator';
import QRList from './components/QRList';
import { healthCheck } from './services/api';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('generate');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    checkAPIHealth();
  }, []);

  const checkAPIHealth = async () => {
    const health = await healthCheck();
    setApiStatus(health.status === 'OK' ? 'online' : 'offline');
  };

  const handleGenerated = (newQR) => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('list');
  };

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="logo">
              <QrCode size={40} />
              <div>
                <h1>QR Code Generator & Tracker</h1>
                <p className="subtitle">Create trackable QR codes with MongoDB storage</p>
              </div>
            </div>
            <div className="status-indicator">
              <span className={`status-dot ${apiStatus}`}></span>
              <span className="status-text">
                {apiStatus === 'online' ? 'API Connected' : 
                 apiStatus === 'offline' ? 'API Offline' : 
                 'Checking...'}
              </span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            Generate QR
          </button>
          <button
            className={`tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            My QR Codes
          </button>
        </div>

        {/* Content */}
        <div className="content">
          {apiStatus === 'offline' && (
            <div className="alert alert-error">
              <strong>⚠️ Backend is offline</strong>
              <p>Please make sure the backend server is running on port 5000</p>
              <button onClick={checkAPIHealth} className="btn btn-sm">
                Retry Connection
              </button>
            </div>
          )}

          {activeTab === 'generate' ? (
            <QRGenerator onGenerated={handleGenerated} />
          ) : (
            <QRList refreshTrigger={refreshTrigger} />
          )}
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>💡 Built with React + MongoDB • All QR codes stored in database</p>
        </footer>
      </div>
    </div>
  );
}

export default App;