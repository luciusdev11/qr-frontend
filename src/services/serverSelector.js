/**
 * Server Selection System v1.0.3a
 * Manual server selection - Railway as primary
 */

const SERVERS = {
  production: {
    name: 'Railway (Primary)',
    url: process.env.REACT_APP_API_URL || 'https://qrserver.up.railway.app/api',
    description: 'Main production server • 2 vCPU + 1GB RAM',
    icon: '🚀',
    color: '#8b5cf6',
    specs: '2 vCPU / 1GB'
  },
  backup: {
    name: 'Render (Backup)',
    url: process.env.REACT_APP_API_URL_BACKUP || 'https://qr-backend-vi8o.onrender.com/api',
    description: 'Backup production server • 0.1 vCPU + 124MB RAM',
    icon: '🔄',
    color: '#3b82f6',
    specs: '0.1 vCPU / 124MB'
  },
  development: {
    name: 'Development (Local)',
    url: process.env.REACT_APP_API_URL_DEV || 'http://localhost:5000/api',
    description: 'Local development server • Optimized for testing',
    icon: '💻',
    color: '#10b981',
    specs: 'Local'
  }
};

class ServerSelector {
  constructor() {
    const savedServer = localStorage.getItem('selectedServer');
    this.currentServer = savedServer || 'production'; // Default to Railway
    this.serverStatus = new Map();
    
    Object.keys(SERVERS).forEach(key => {
      this.serverStatus.set(key, 'unknown');
    });
  }

  getCurrentServer() {
    return SERVERS[this.currentServer];
  }

  getCurrentURL() {
    return SERVERS[this.currentServer].url;
  }

  switchServer(serverKey) {
    if (SERVERS[serverKey]) {
      this.currentServer = serverKey;
      localStorage.setItem('selectedServer', serverKey);
      this.notifyServerChange(serverKey);
      return true;
    }
    return false;
  }

  getServers() {
    return Object.entries(SERVERS).map(([key, server]) => ({
      key,
      ...server,
      status: this.serverStatus.get(key),
      isCurrent: key === this.currentServer
    }));
  }

  async checkServerHealth(serverKey) {
    const server = SERVERS[serverKey];
    if (!server) return false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${server.url}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.serverStatus.set(serverKey, 'online');
        return true;
      }

      throw new Error('Health check failed');

    } catch (error) {
      clearTimeout(timeoutId);
      this.serverStatus.set(serverKey, 'offline');
      console.warn(`❌ ${server.name} is offline:`, error.message);
      return false;
    }
  }

  async checkAllServers() {
    console.log('🔍 Checking all servers...');
    
    const checks = Object.keys(SERVERS).map(key => 
      this.checkServerHealth(key)
    );
    
    await Promise.allSettled(checks);

    Object.entries(SERVERS).forEach(([key, server]) => {
      const status = this.serverStatus.get(key);
      const icon = status === 'online' ? '✅' : '❌';
      console.log(`${icon} ${server.name}: ${status}`);
    });
  }

  getStatus(serverKey) {
    return this.serverStatus.get(serverKey);
  }

  notifyServerChange(serverKey) {
    const event = new CustomEvent('server-changed', {
      detail: { 
        server: SERVERS[serverKey],
        key: serverKey
      }
    });
    window.dispatchEvent(event);
  }
}

const serverSelector = new ServerSelector();

// Check servers on load
serverSelector.checkAllServers();

// Periodic health check (every 60 seconds)
setInterval(() => {
  serverSelector.checkAllServers();
}, 60000);

export default serverSelector;