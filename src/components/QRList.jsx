import React, { useState, useEffect, useRef } from 'react';
import { Eye, Download, Trash2, ExternalLink, Calendar, RefreshCw, BarChart3 } from 'lucide-react';
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
            onClick={() => setAutoRefresh(!autoRefresh)} 
            className={`btn btn-icon ${autoRefresh ? 'btn-active' : ''}`}
            title={autoRefresh ? 'Auto-refresh ON (click to disable)' : 'Auto-refresh OFF (click to enable)'}
          >
            {autoRefresh ? (
              <>
                <RefreshCw className="spin-slow" size={18} />
                <span className="countdown-badge">{countdown}s</span>
              </>
            ) : (
              <RefreshCw size={18} />
            )}
          </button>
          <button onClick={loadQRCodes} className="btn btn-icon" title="Refresh now">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="qr-grid">
        {qrCodes.map((qr) => (
          <div key={qr.shortId} className="qr-card">
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
                  className="url-link"
                >
                  {qr.originalUrl.length > 40 
                    ? qr.originalUrl.substring(0, 40) + '...' 
                    : qr.originalUrl}
                  <ExternalLink size={14} />
                </a>
              </div>

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
                  className="tracking-input"
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
              <h3>QR Code Statistics</h3>
              <button onClick={() => setStats(null)} className="modal-close">
                ×
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
              
              {stats.recentScans && stats.recentScans.length > 0 && (
                <div className="recent-scans">
                  <h4>Recent Scans:</h4>
                  <ul>
                    {stats.recentScans.map((scan, idx) => (
                      <li key={idx}>
                        {formatDate(scan.timestamp)}
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