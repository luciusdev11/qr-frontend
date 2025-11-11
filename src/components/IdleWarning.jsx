import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import './IdleWarning.css';

function IdleWarning({ remainingTime, onStayActive }) {
  const seconds = Math.floor(remainingTime / 1000);
  const showWarning = seconds <= 30 && seconds > 0;

  if (!showWarning) return null;

  return (
    <div className="idle-warning">
      <div className="idle-warning-content">
        <div className="warning-icon">
          <Clock size={32} />
        </div>
        <div className="warning-text">
          <h3>Session Expiring Soon!</h3>
          <p>You'll be logged out in <strong>{seconds} seconds</strong> due to inactivity.</p>
        </div>
        <button onClick={onStayActive} className="btn-stay-active">
          <RefreshCw size={18} />
          Stay Active
        </button>
      </div>
    </div>
  );
}

export default IdleWarning;