import React, { useState, useEffect } from 'react';
import { Server, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { getServers, switchServer, checkServerHealth } from '../services/api';
import './ServerSelector.css';

function ServerSelector({ onClose }) {
  const [servers, setServers] = useState([]);
  const [checking, setChecking] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    loadServers();
    
    // Listen for server changes
    const handleServerChange = () => {
      loadServers();
    };
    
    window.addEventListener('server-changed', handleServerChange);
    
    return () => {
      window.removeEventListener('server-changed', handleServerChange);
    };
  }, []);

  const loadServers = () => {
    const serverList = getServers();
    setServers(serverList);
  };

  const handleSelectServer = (serverKey) => {
    switchServer(serverKey);
    loadServers();
    
    // Show success message
    const server = servers.find(s => s.key === serverKey);
    console.log(`✅ Switched to ${server.name}`);
    
    // Reload page to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleCheckHealth = async () => {
    setChecking(true);
    
    for (const server of servers) {
      await checkServerHealth(server.key);
    }
    
    loadServers();
    setChecking(false);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // match animation duration
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <Check size={18} className="status-check" />;
      case 'offline':
        return <AlertCircle size={18} className="status-error" />;
      default:
        return <RefreshCw size={18} className="status-checking" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return '#10b981';
      case 'offline':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="server-selector-overlay" onClick={onClose}>
        <div
            className={`server-selector-modal ${closing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
        >
        <div className="server-selector-header">
          <div className="header-title">
            <Server size={24} />
            <h2>Select Server</h2>
          </div>
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        </div>

        <div className="server-selector-body">
          <p className="selector-description">
            Choose which server to connect to. Changes take effect immediately.
          </p>

          <div className="servers-list">
            {servers.map((server) => (
              <div
                key={server.key}
                className={`server-item ${server.isCurrent ? 'active' : ''}`}
                onClick={() => !server.isCurrent && handleSelectServer(server.key)}
              >
                <div className="server-icon" style={{ color: server.color }}>
                  <span className="icon-emoji">{server.icon}</span>
                </div>

                <div className="server-info">
                  <div className="server-name">
                    {server.name}
                    {server.isCurrent && (
                      <span className="current-badge">Current</span>
                    )}
                  </div>
                  <div className="server-description">{server.description}</div>
                  <div className="server-url">{server.url}</div>
                </div>

                <div className="server-status">
                  <div 
                    className="status-indicator"
                    style={{ borderColor: getStatusColor(server.status) }}
                  >
                    {getStatusIcon(server.status)}
                  </div>
                  <span 
                    className="status-text"
                    style={{ color: getStatusColor(server.status) }}
                  >
                    {server.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="selector-actions">
            <button 
              onClick={handleCheckHealth} 
              className="btn-check-health"
              disabled={checking}
            >
              {checking ? (
                <>
                  <RefreshCw size={18} className="spinner" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Check All Servers
                </>
              )}
            </button>
          </div>

          <div className="selector-note">
            <AlertCircle size={16} />
            <p>
              <strong>Development Server:</strong> Use for local testing. 
              Ensure your backend is running on localhost:5000
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServerSelector;