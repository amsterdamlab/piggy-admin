import { icons } from '../icons.js';

export class ToastManager {
  constructor() {
    this.container = null;
  }

  ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(message, type = 'info', duration = 3500) {
    this.ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconHtml = icons.zap;
    if (type === 'success') iconHtml = `<span style="color: var(--accent-green)">${icons.check}</span>`;
    if (type === 'error') iconHtml = `<span style="color: var(--accent-red)">${icons.x}</span>`;
    if (type === 'info') iconHtml = `<span style="color: var(--accent-blue)">${icons.zap}</span>`;

    toast.innerHTML = `
      <div class="toast-icon">${iconHtml}</div>
      <div class="toast-message">${message}</div>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  success(msg, duration) {
    this.show(msg, 'success', duration);
  }

  error(msg, duration) {
    this.show(msg, 'error', duration);
  }

  info(msg, duration) {
    this.show(msg, 'info', duration);
  }
}

export const toast = new ToastManager();
