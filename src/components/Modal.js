import { icons } from '../icons.js';

class ModalManager {
  constructor() {
    this.overlay = null;
    this.container = null;
    this.currentCloseCallback = null;
    this.init();
  }

  init() {
    if (document.querySelector('.modal-overlay')) return;

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-title">Título Modal</h3>
          <button class="modal-close" id="modal-close-btn" aria-label="Cerrar">
            ${icons.x}
          </button>
        </div>
        <div class="modal-body" id="modal-body"></div>
        <div class="modal-footer" id="modal-footer"></div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    const closeBtn = this.overlay.querySelector('#modal-close-btn');
    closeBtn.addEventListener('click', () => this.close());

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.close();
      }
    });
  }

  open({ title, contentHtml, footerButtons = [], size = 'medium', onClose = null, onInit = null }) {
    this.init();
    this.currentCloseCallback = onClose;

    const titleEl = this.overlay.querySelector('#modal-title');
    const bodyEl = this.overlay.querySelector('#modal-body');
    const footerEl = this.overlay.querySelector('#modal-footer');
    const containerEl = this.overlay.querySelector('.modal-container');

    titleEl.innerHTML = title || 'Ventana de Gestión';
    bodyEl.innerHTML = contentHtml || '';
    footerEl.innerHTML = '';

    if (size === 'large') {
      containerEl.style.maxWidth = '850px';
    } else if (size === 'small') {
      containerEl.style.maxWidth = '400px';
    } else {
      containerEl.style.maxWidth = '600px';
    }

    if (footerButtons && footerButtons.length > 0) {
      footerEl.style.display = 'flex';
      footerButtons.forEach((btnConfig) => {
        const btn = document.createElement('button');
        btn.className = `btn ${btnConfig.class || 'btn-secondary'}`;
        btn.innerHTML = btnConfig.text;
        btn.addEventListener('click', (e) => {
          if (btnConfig.onClick) {
            btnConfig.onClick(e, this);
          } else {
            this.close();
          }
        });
        footerEl.appendChild(btn);
      });
    } else {
      footerEl.style.display = 'none';
    }

    this.overlay.classList.add('active');

    if (onInit) {
      setTimeout(() => onInit(bodyEl, this), 10);
    }
  }

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
    }
    if (this.currentCloseCallback) {
      this.currentCloseCallback();
      this.currentCloseCallback = null;
    }
  }
}

export const modal = new ModalManager();
