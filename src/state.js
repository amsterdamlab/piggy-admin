class StateStore {
  constructor() {
    this.listeners = new Map();
    this.state = {
      admin: this.loadAdminFromStorage(),
      activeRoute: '#dashboard',
      pendingCounts: {
        recharges: 0,
        withdrawals: 0,
        total: 0
      },
      stats: {
        totalUsers: 0,
        totalPiggies: 0,
        totalInvested: 0,
        pendingTotal: 0
      }
    };
  }

  loadAdminFromStorage() {
    try {
      const stored = localStorage.getItem('piggy_admin_session');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading stored admin session', e);
    }
    return null;
  }

  saveAdminToStorage(admin) {
    if (admin) {
      localStorage.setItem('piggy_admin_session', JSON.stringify(admin));
    } else {
      localStorage.removeItem('piggy_admin_session');
    }
  }

  getState() {
    return { ...this.state };
  }

  getAdmin() {
    return this.state.admin;
  }

  isAuthenticated() {
    return !!this.state.admin;
  }

  setAdmin(admin) {
    this.state.admin = admin;
    this.saveAdminToStorage(admin);
    this.emit('admin_changed', admin);
  }

  logout() {
    this.setAdmin(null);
    this.emit('logout');
  }

  setActiveRoute(route) {
    this.state.activeRoute = route;
    this.emit('route_changed', route);
  }

  setPendingCounts(counts) {
    this.state.pendingCounts = {
      recharges: counts.recharges || 0,
      withdrawals: counts.withdrawals || 0,
      total: (counts.recharges || 0) + (counts.withdrawals || 0)
    };
    this.emit('pending_counts_changed', this.state.pendingCounts);
  }

  setStats(stats) {
    this.state.stats = { ...this.state.stats, ...stats };
    this.emit('stats_changed', this.state.stats);
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in state listener for event "${event}":`, err);
        }
      });
    }
  }
}

export const store = new StateStore();
