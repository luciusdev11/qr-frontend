import React, { useState } from 'react';
import { Link2, Loader } from 'lucide-react';
import { qrAPI } from '../services/api';
import './QRGenerator.css';

function QRGenerator({ onGenerated }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateUrl = (urlString) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL (include http:// or https://)');
      return;
    }

    setLoading(true);

    try {
      const response = await qrAPI.generate(url);
      
      if (response.success) {
        setUrl('');
        if (onGenerated) {
          onGenerated(response.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qr-generator">
      <form onSubmit={handleGenerate} className="generator-form">
        <div className="form-group">
          <label htmlFor="url-input" className="form-label">
            <Link2 size={18} />
            Enter URL to generate QR code
          </label>
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="form-input"
            disabled={loading}
          />
          {error && <p className="error-message">{error}</p>}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <Loader className="spinner" size={18} />
              Generating...
            </>
          ) : (
            'Generate Trackable QR Code'
          )}
        </button>
      </form>

      <div className="info-box">
        <h3>How it works:</h3>
        <ul>
          <li>• Enter any URL you want to track</li>
          <li>• We generate a unique trackable QR code</li>
          <li>• When scanned, we log the scan and redirect to your URL</li>
          <li>• View scan statistics in the "My QR Codes" tab</li>
          <li>• All data is stored in MongoDB database</li>
        </ul>
      </div>
    </div>
  );
}

export default QRGenerator;