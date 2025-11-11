import React, { useState } from 'react';
import { Lock, User, Sparkles, Zap } from 'lucide-react';
import './Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="anime-stars"></div>
        <div className="anime-stars"></div>
        <div className="anime-stars"></div>
        <div className="floating-particles"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <Zap size={48} className="icon-glow" />
          </div>
          <h1>QR Tracker</h1>
          <p className="version-badge">v1.0.2b • Personal Edition</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label htmlFor="username">
              <User size={18} />
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoComplete="username"
              className="anime-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">
              <Lock size={18} />
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              autoComplete="current-password"
              className="anime-input"
            />
          </div>

          {error && (
            <div className="error-alert">
              <span>⚠️ {error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading || !username || !password}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Authenticating...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Access Dashboard
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>🔐 Secure Session • Auto-logout on tab close</p>
        </div>
      </div>
    </div>
  );
}

export default Login;