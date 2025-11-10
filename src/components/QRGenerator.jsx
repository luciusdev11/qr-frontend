import React, { useState } from 'react';
import { Link2, Loader, Image, Sparkles, Palette, RefreshCw } from 'lucide-react';
import { qrAPI } from '../services/api';
import './QRGenerator.css';

function QRGenerator({ onGenerated }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Customization options
  const [dotStyle, setDotStyle] = useState('square');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [gradientType, setGradientType] = useState('none');
  const [gradientStart, setGradientStart] = useState('#000000');
  const [gradientEnd, setGradientEnd] = useState('#667eea');
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const validateUrl = (urlString) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Logo file too large. Max 10MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result);
        setLogoPreview(reader.result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  const resetCustomization = () => {
    setDotStyle('square');
    setBackgroundColor('#FFFFFF');
    setForegroundColor('#000000');
    setGradientType('none');
    setGradientStart('#000000');
    setGradientEnd('#667eea');
    setLogo(null);
    setLogoPreview(null);
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
        dotStyle,
        backgroundColor,
        foregroundColor,
        gradientType,
        gradientStartColor: gradientStart,
        gradientEndColor: gradientEnd,
        logoSize: 0.2
      };

      const response = await qrAPI.generate(url, 'anonymous', customization, logo);
      
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

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn-toggle-advanced"
        >
          <Sparkles size={18} />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Customization
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="advanced-options">
            <div className="options-header">
              <h3>
                <Palette size={20} />
                Customize Your QR Code
              </h3>
              <button type="button" onClick={resetCustomization} className="btn-reset">
                <RefreshCw size={16} />
                Reset
              </button>
            </div>

            {/* Dot Style */}
            <div className="form-group">
              <label className="form-label">Dot Style</label>
              <div className="style-options">
                {['square', 'rounded', 'dots', 'classy'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    className={`style-btn ${dotStyle === style ? 'active' : ''}`}
                    onClick={() => setDotStyle(style)}
                  >
                    <div className={`style-preview style-${style}`}></div>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
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

            {/* Gradient */}
            <div className="form-group">
              <label className="form-label">Gradient</label>
              <select
                value={gradientType}
                onChange={(e) => setGradientType(e.target.value)}
                className="form-select"
              >
                <option value="none">None</option>
                <option value="linear">Linear</option>
                <option value="radial">Radial</option>
              </select>
            </div>

            {gradientType !== 'none' && (
              <div className="color-group">
                <div className="form-group">
                  <label className="form-label">Gradient Start</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={gradientStart}
                      onChange={(e) => setGradientStart(e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={gradientStart}
                      onChange={(e) => setGradientStart(e.target.value)}
                      className="color-text"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Gradient End</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={gradientEnd}
                      onChange={(e) => setGradientEnd(e.target.value)}
                      className="color-input"
                    />
                    <input
                      type="text"
                      value={gradientEnd}
                      onChange={(e) => setGradientEnd(e.target.value)}
                      className="color-text"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Logo Upload */}
            <div className="form-group">
              <label className="form-label">
                <Image size={18} />
                Add Logo (Optional)
              </label>
              <div className="logo-upload-area">
                {!logoPreview ? (
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="file-input"
                    />
                    <div className="upload-content">
                      <Image size={48} />
                      <p>Click to upload logo</p>
                      <span>PNG, JPG up to 10MB</span>
                    </div>
                  </label>
                ) : (
                  <div className="logo-preview">
                    <img src={logoPreview} alt="Logo preview" />
                    <button type="button" onClick={removeLogo} className="btn-remove-logo">
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>
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
              Generating Custom QR...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Generate {showAdvanced ? 'Custom' : 'Trackable'} QR Code
            </>
          )}
        </button>
      </form>

      <div className="info-box">
        <h3>How it works:</h3>
        <ul>
          <li>• Enter any URL you want to track</li>
          <li>• Customize colors, shapes, and add your logo</li>
          <li>• We generate a unique trackable QR code</li>
          <li>• When scanned, we log the scan and redirect to your URL</li>
          <li>• View scan statistics in the "My QR Codes" tab</li>
        </ul>
      </div>
    </div>
  );
}

export default QRGenerator;