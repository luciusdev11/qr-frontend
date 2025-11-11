import React, { useState, useEffect, useRef } from 'react';
import { Eye, Download, Trash2, ExternalLink, Calendar, RefreshCw, BarChart3, EyeOff } from 'lucide-react';
import { qrAPI } from '../services/api';
import './QRList.css';

function QRList({ refreshTrigger }) {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQR, setSelectedQR] = useState(null);
  const [stats, setStats] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState(null);
  const prevScansRef = useRef({});
  const [updatedQRs, setUpdatedQRs] = useState(new Set());
  const [urlsBlurred, setUrlsBlurred] = useState(true); // New: URLs blurred by default

  useEffect(() => {
    loadQRCodes();
  }, [refreshTrigger]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    let interval;
    let countdownInterval;
    
    if (autoRefresh) {
      // Refresh data every 5 seconds
      interval = setInterval(() => {
        loadQRCodes();
        setCountdown(5); // Reset countdown
      }, 5000);

      // Countdown timer
      countdownInterval = setInterval(() => {
        setCountdown(prev => prev > 0 ? prev - 1 : 5);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [autoRefresh]);

  const loadQRCodes = async () => {
    // Don't show loading spinner on auto-refresh
    if (qrCodes.length === 0) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError('');
    
    try {
      const response = await qrAPI.list();
      if (response.success) {
        // Check for new scans
        response.data.forEach(qr => {
          const prevScans = prevScansRef.current[qr.shortId];
          if (prevScans !== undefined && qr.scans > prevScans) {
            const newScans = qr.scans - prevScans;
            setNotification({
              message: `🎉 New scan detected! +${newScans} scan${newScans > 1 ? 's' : ''}`,
              id: Date.now()
            });
            setTimeout(() => setNotification(null), 3000);
            
            // Add to updated QRs for pulse effect
            setUpdatedQRs(prev => new Set([...prev, qr.shortId]));
            setTimeout(() => {
              setUpdatedQRs(prev => {
                const newSet = new Set(prev);
                newSet.delete(qr.shortId);
                return newSet;
              });
            }, 2000);
          }
          prevScansRef.current[qr.shortId] = qr.scans;
        });
        
        setQrCodes(response.data);
      }
    } catch (err) {
      setError('Failed to load QR codes');
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (shortId) => {
    if (!window.confirm('Are you sure you want to delete this QR code?')) {
      return;
    }

    try {
      await qrAPI.delete(shortId);
      setQrCodes(qrCodes.filter(qr => qr.shortId !== shortId));
    } catch (err) {
      alert('Failed to delete QR code');
    }
  };

  const handleDownload = (qrCodeImage, shortId) => {
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `qr-${shortId}.png`;
    link.click();
  };

  const handleViewStats = async (shortId) => {
    try {
      const response = await qrAPI.getStats(shortId);
      if (response.success) {
        setStats(response.data);
        setSelectedQR(shortId);
      }
    } catch (err) {
      alert('Failed to load statistics');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <RefreshCw className="spinner" size={48} />
        <p>Loading QR codes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={loadQRCodes} className="btn btn-secondary">
          Try Again
        </button>
      </div>
    );
  }

  if (qrCodes.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📱</div>
        <h3>No QR codes yet</h3>
        <p>Generate your first QR code to get started</p>
      </div>
    );
  }

  return (
    <div className="qr-list">
      {/* Notification Toast */}
      {notification && (
        <div className="toast-notification">
          {notification.message}
        </div>
      )}
      
      <div className="list-header">
        <div className="header-left">
          <h2>My QR Codes ({qrCodes.length})</h2>
          {isRefreshing && <span className="refresh-indicator">Refreshing...</span>}
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setUrlsBlurred(!urlsBlurred)}
            className="btn btn-icon"
            title={urlsBlurred ? 'Show URLs' : 'Hide URLs'}
          >
            {urlsBlurred ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <div className="auto-refresh-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
              />
              <span className="toggle-slider">
                <span className="toggle-label">
                  {autoRefresh ? `Auto ${countdown}s` : 'Manual'}
                </span>
              </span>
            </label>
          </div>
          <button onClick={loadQRCodes} className="btn btn-icon" title="Refresh now">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="qr-grid">
        {qrCodes.map((qr) => (
          <div 
            key={qr.shortId} 
            className={`qr-card ${updatedQRs.has(qr.shortId) ? 'qr-card-updated' : ''}`}
          >
            <div className="qr-card-header">
              <img
                src={qr.qrCodeImage}
                alt="QR Code"
                className="qr-image"
              />
            </div>

            <div className="qr-card-body">
              <div className="qr-url">
                <label>Original URL:</label>
                <a
                  href={qr.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`url-link ${urlsBlurred ? 'blurred' : ''}`}
                >
                  {qr.originalUrl.length > 40 
                    ? qr.originalUrl.substring(0, 40) + '...' 
                    : qr.originalUrl}
                  <ExternalLink size={14} />
                </a>
              </div>

              {/* Show customization info */}
              {qr.customization && (qr.customization.hasLogo || qr.customization.gradientType !== 'none' || qr.customization.dotStyle !== 'square') && (
                <div className="qr-custom-badges">
                  {qr.customization.hasLogo && (
                    <span className="custom-badge badge-logo">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                      Logo
                    </span>
                  )}
                  {qr.customization.gradientType !== 'none' && (
                    <span className="custom-badge badge-gradient">
                      ✨ Gradient
                    </span>
                  )}
                  {qr.customization.dotStyle !== 'square' && (
                    <span className="custom-badge badge-style">
                      🎨 {qr.customization.dotStyle}
                    </span>
                  )}
                </div>
              )}

              <div className="qr-info">
                <div className="info-item">
                  <Calendar size={16} />
                  <span>{formatDate(qr.createdAt)}</span>
                </div>
                <div className="info-item scans">
                  <Eye size={16} />
                  <span className="scan-count">{qr.scans} scans</span>
                </div>
              </div>

              <div className="tracking-url">
                <label>Tracking URL:</label>
                <input
                  type="text"
                  value={qr.trackingUrl}
                  readOnly
                  className={`tracking-input ${urlsBlurred ? 'blurred' : ''}`}
                  onClick={(e) => e.target.select()}
                />
              </div>

              <div className="qr-actions">
                <button
                  onClick={() => handleViewStats(qr.shortId)}
                  className="btn btn-secondary btn-sm"
                  title="View Statistics"
                >
                  <BarChart3 size={16} />
                  Stats
                </button>
                <button
                  onClick={() => handleDownload(qr.qrCodeImage, qr.shortId)}
                  className="btn btn-success btn-sm"
                  title="Download"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={() => handleDelete(qr.shortId)}
                  className="btn btn-danger btn-sm"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Modal */}
      {stats && selectedQR && (
        <div className="modal-overlay" onClick={() => setStats(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 QR Code Statistics</h3>
              <button onClick={() => setStats(null)} className="modal-close">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="stat-item">
                <label>Total Scans:</label>
                <span className="stat-value">{stats.totalScans}</span>
              </div>
              <div className="stat-item">
                <label>Created:</label>
                <span>{formatDate(stats.createdAt)}</span>
              </div>
              {stats.lastScan && (
                <div className="stat-item">
                  <label>Last Scan:</label>
                  <span>{formatDate(stats.lastScan)}</span>
                </div>
              )}
              
              {/* Scan Graph */}
              {stats.scansByDay && Object.keys(stats.scansByDay).length > 0 && (
                <div className="scan-graph">
                  <h4>📈 Scans by Day</h4>
                  <div className="graph-container">
                    {Object.entries(stats.scansByDay)
                      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                      .slice(-7) // Last 7 days
                      .map(([date, count]) => {
                        const maxScans = Math.max(...Object.values(stats.scansByDay));
                        const heightPercent = (count / maxScans) * 100;
                        return (
                          <div key={date} className="graph-bar-wrapper">
                            <div className="graph-bar-container">
                              <div 
                                className="graph-bar" 
                                style={{ height: `${heightPercent}%` }}
                                title={`${count} scans`}
                              >
                                <span className="bar-value">{count}</span>
                              </div>
                            </div>
                            <div className="graph-label">
                              {new Date(date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {stats.recentScans && stats.recentScans.length > 0 && (
                <div className="recent-scans">
                  <h4>🕐 Recent Scans</h4>
                  <ul>
                    {stats.recentScans.map((scan, idx) => (
                      <li key={idx}>
                        <span className="scan-time">{formatDate(scan.timestamp)}</span>
                        {scan.userAgent && (
                          <span className="scan-device">
                            {scan.userAgent.includes('Mobile') ? '📱' : '💻'}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QRList;