import React, { useState } from 'react';
import { Link2, Loader, Sparkles } from 'lucide-react';
import { qrAPI } from '../services/api';
import './QRGenerator.css';

function QRGenerator({ onGenerated }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Basic customization only
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [foregroundColor, setForegroundColor] = useState('#000000');

  const validateUrl = (urlString) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const resetCustomization = () => {
    setBackgroundColor('#FFFFFF');
    setForegroundColor('#000000');
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
      const customization = {
        backgroundColor,
        foregroundColor,
        // Advanced features disabled in v1.0.2b
        dotStyle: 'square',
        gradientType: 'none'
      };

      const response = await qrAPI.generate(url, 'anonymous', customization, null);
      
      if (response.success) {
        setUrl('');
        resetCustomization();
        if (onGenerated) {
          onGenerated(response.data);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="qr-generator">
      <form onSubmit={handleGenerate} className="generator-form">
        {/* URL Input */}
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

        {/* Basic Customization Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn-toggle-advanced"
        >
          <Sparkles size={18} />
          {showAdvanced ? 'Hide' : 'Show'} Color Customization
        </button>

        {/* Basic Color Options */}
        {showAdvanced && (
          <div className="advanced-options">
            <div className="options-header">
              <h3>
                🎨 Customize Colors
              </h3>
              <button type="button" onClick={resetCustomization} className="btn-reset-small">
                Reset
              </button>
            </div>

            {/* Colors Only */}
            <div className="color-group">
              <div className="form-group">
                <label className="form-label">Background Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="color-text"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Foreground Color</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={foregroundColor}
                    onChange={(e) => setForegroundColor(e.target.value)}
                    className="color-input"
                  />
                  <input
                    type="text"
                    value={foregroundColor}
                    onChange={(e) => setForegroundColor(e.target.value)}
                    className="color-text"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div className="feature-notice">
              <p>🚧 Advanced features (gradients, logos, dot styles) temporarily disabled</p>
              <p>Coming back in v1.0.3 with full stability!</p>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <Loader className="spinner" size={18} />
              Generating QR Code...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate Trackable QR Code
            </>
          )}
        </button>
      </form>

      <div className="info-box">
        <h3>✨ How it works:</h3>
        <ul>
          <li>• Enter any URL you want to track</li>
          <li>• Customize colors (background & foreground)</li>
          <li>• We generate a unique trackable QR code</li>
          <li>• When scanned, we log the scan and redirect to your URL</li>
          <li>• View real-time statistics in the "My QR Codes" tab</li>
        </ul>
      </div>
    </div>
  );
}

export default QRGenerator