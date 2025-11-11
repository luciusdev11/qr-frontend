/**
 * Backend Failover System
 * Automatically switches between multiple backend servers
 * Priority: Render -> Railway/Fly.io -> Ngrok (local)
 */

const BACKENDS = [
    {
      name: 'Render (Primary)',
      url: process.env.REACT_APP_API_URL || 'https://your-app.onrender.com/api',
      timeout: 10000,
      priority: 1
    },
    {
      name: 'Railway (Backup)',
      url: process.env.REACT_APP_API_URL_BACKUP || 'https://your-app.railway.app/api',
      timeout: 8000,
      priority: 2
    },
    {
      name: 'Ngrok (Local)',
      url: process.env.REACT_APP_API_URL_LOCAL || 'https://your-ngrok-url.ngrok.io/api',
      timeout: 5000,
      priority: 3
    }
  ];
  
  class BackendFailover {
    constructor() {
      this.currentBackend = null;
      this.backendStatus = new Map();
      this.failureCount = new Map();
      this.lastCheck = new Map();
      
      // Initialize status
      BACKENDS.forEach(backend => {
        this.backendStatus.set(backend.name, 'unknown');
        this.failureCount.set(backend.name, 0);
        this.lastCheck.set(backend.name, 0);
      });
  
      // Set initial backend
      this.currentBackend = BACKENDS[0];
      this.checkAllBackends();
    }
  
    /**
     * Get current active backend
     */
    getCurrentBackend() {
      return this.currentBackend;
    }
  
    /**
     * Get current backend URL
     */
    getCurrentURL() {
      return this.currentBackend.url;
    }
  
    /**
     * Check health of a specific backend
     */
    async checkBackendHealth(backend) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), backend.timeout);
  
      try {
        const response = await fetch(`${backend.url}/health`, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        });
  
        clearTimeout(timeoutId);
  
        if (response.ok) {
          this.backendStatus.set(backend.name, 'online');
          this.failureCount.set(backend.name, 0);
          this.lastCheck.set(backend.name, Date.now());
          return true;
        }
  
        throw new Error('Health check failed');
  
      } catch (error) {
        clearTimeout(timeoutId);
        this.backendStatus.set(backend.name, 'offline');
        this.failureCount.set(backend.name, this.failureCount.get(backend.name) + 1);
        this.lastCheck.set(backend.name, Date.now());
        
        console.warn(`❌ ${backend.name} is offline:`, error.message);
        return false;
      }
    }
  
    /**
     * Check all backends and update status
     */
    async checkAllBackends() {
      console.log('🔍 Checking all backends...');
      
      const checks = BACKENDS.map(backend => this.checkBackendHealth(backend));
      await Promise.allSettled(checks);
  
      // Log status
      BACKENDS.forEach(backend => {
        const status = this.backendStatus.get(backend.name);
        const icon = status === 'online' ? '✅' : '❌';
        console.log(`${icon} ${backend.name}: ${status}`);
      });
  
      // Select best available backend
      this.selectBestBackend();
    }
  
    /**
     * Select the best available backend based on priority
     */
    selectBestBackend() {
      // Find first online backend by priority
      const availableBackend = BACKENDS
        .sort((a, b) => a.priority - b.priority)
        .find(backend => this.backendStatus.get(backend.name) === 'online');
  
      if (availableBackend) {
        if (this.currentBackend.name !== availableBackend.name) {
          console.log(`🔄 Switching to: ${availableBackend.name}`);
          this.currentBackend = availableBackend;
          
          // Notify user
          this.notifyBackendChange(availableBackend.name);
        }
      } else {
        console.error('❌ All backends are offline!');
        this.notifyAllBackendsDown();
      }
    }
  
    /**
     * Make API request with automatic failover
     */
    async makeRequest(endpoint, options = {}) {
      let lastError = null;
      
      // Try current backend first
      try {
        return await this.tryBackend(this.currentBackend, endpoint, options);
      } catch (error) {
        lastError = error;
        console.warn(`Failed on ${this.currentBackend.name}, trying failover...`);
      }
  
      // Try other backends in order
      for (const backend of BACKENDS) {
        if (backend.name === this.currentBackend.name) continue;
        
        if (this.backendStatus.get(backend.name) !== 'offline') {
          try {
            const result = await this.tryBackend(backend, endpoint, options);
            
            // Success! Switch to this backend
            this.currentBackend = backend;
            this.notifyBackendChange(backend.name);
            
            return result;
          } catch (error) {
            lastError = error;
            console.warn(`Failed on ${backend.name}, trying next...`);
          }
        }
      }
  
      // All backends failed
      throw lastError || new Error('All backends are unavailable');
    }
  
    /**
     * Try making request to specific backend
     */
    async tryBackend(backend, endpoint, options) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), backend.timeout);
  
      try {
        const url = `${backend.url}${endpoint}`;
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          credentials: 'include'
        });
  
        clearTimeout(timeoutId);
  
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
  
        const data = await response.json();
        
        // Mark backend as healthy
        this.backendStatus.set(backend.name, 'online');
        this.failureCount.set(backend.name, 0);
        
        return data;
  
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Mark backend as unhealthy
        const failures = this.failureCount.get(backend.name) + 1;
        this.failureCount.set(backend.name, failures);
        
        if (failures >= 3) {
          this.backendStatus.set(backend.name, 'offline');
        }
  
        throw error;
      }
    }
  
    /**
     * Notify user of backend change
     */
    notifyBackendChange(backendName) {
      const event = new CustomEvent('backend-changed', {
        detail: { backend: backendName }
      });
      window.dispatchEvent(event);
    }
  
    /**
     * Notify user all backends are down
     */
    notifyAllBackendsDown() {
      const event = new CustomEvent('backends-down');
      window.dispatchEvent(event);
    }
  
    /**
     * Get status of all backends
     */
    getStatus() {
      return BACKENDS.map(backend => ({
        name: backend.name,
        url: backend.url,
        status: this.backendStatus.get(backend.name),
        failures: this.failureCount.get(backend.name),
        lastCheck: this.lastCheck.get(backend.name),
        isCurrent: backend.name === this.currentBackend.name
      }));
    }
  
    /**
     * Force backend switch
     */
    async switchBackend(backendName) {
      const backend = BACKENDS.find(b => b.name === backendName);
      
      if (!backend) {
        throw new Error('Backend not found');
      }
  
      const isHealthy = await this.checkBackendHealth(backend);
      
      if (isHealthy) {
        this.currentBackend = backend;
        this.notifyBackendChange(backend.name);
        return true;
      }
  
      return false;
    }
  }
  
  // Singleton instance
  const backendFailover = new BackendFailover();
  
  // Check backends periodically
  setInterval(() => {
    backendFailover.checkAllBackends();
  }, 30000); // Every 30 seconds
  
  export default backendFailover;