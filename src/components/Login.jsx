import React, { useState } from 'react';
import { Lock, User, Sparkles } from 'lucide-react';
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/login`, {
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
      setError('Network error. Please try again.');
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
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <Sparkles size={48} />
          </div>
          <h1>QR Tracker</h1>
          <p>Personal QR Code Management</p>
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
            />
          </div>

          {error && (
            <div className="error-alert">
              <span>❌ {error}</span>
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
                Logging in...
              </>
            ) : (
              <>
                <Lock size={18} />
                Login
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>🔐 Personal use only • Secure session</p>
        </div>
      </div>
    </div>
  );
}

export default Login;