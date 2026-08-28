/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - FORM UTILS
   Helpers for Currency Formatting (thousands separator) & DateTime Mini Picker
   ========================================================================== */

import { icons } from '../icons.js';

/**
 * Format a number as Colombian pesos with thousand separators (dots) without COP suffix.
 * @param {number|string} val 
 * @param {boolean} includeSymbol - Whether to prepend "$"
 * @returns {string} e.g. "1.200.000" or "$1.200.000"
 */
export function formatCurrency(val, includeSymbol = false) {
  if (val === null || val === undefined || val === '') return includeSymbol ? '$0' : '0';
  const cleanNumber = typeof val === 'number' ? val : Number(String(val).replace(/\D/g, '')) || 0;
  const formatted = cleanNumber.toLocaleString('es-CO');
  return includeSymbol ? `$${formatted}` : formatted;
}

/**
 * Parse any formatted currency or text string into a clean numeric value.
 * @param {string|number} str 
 * @returns {number} e.g. "1.200.000" -> 1200000
 */
export function parseCurrency(str) {
  if (typeof str === 'number') return isNaN(str) ? 0 : str;
  if (!str) return 0;
  const digitsOnly = String(str).replace(/\D/g, '');
  return digitsOnly ? Number(digitsOnly) : 0;
}

/**
 * Attaches real-time thousand separator formatting to any input element.
 * @param {HTMLInputElement} inputEl 
 * @param {Object} options 
 * @returns {Object} { getRawValue(), setRawValue(num) }
 */
export function setupCurrencyInput(inputEl, options = {}) {
  if (!inputEl) return null;

  // Change input type to text for thousand separator support
  inputEl.type = 'text';
  inputEl.inputMode = 'numeric';
  inputEl.autocomplete = 'off';

  const formatAndSet = (raw) => {
    const num = parseCurrency(raw);
    inputEl.value = num > 0 ? num.toLocaleString('es-CO') : (raw === '0' || raw === 0 ? '0' : '');
    if (options.onChange) options.onChange(num);
  };

  // Initial formatting
  if (inputEl.value) {
    formatAndSet(inputEl.value);
  }

  inputEl.addEventListener('input', () => {
    const rawVal = inputEl.value;
    const digits = rawVal.replace(/\D/g, '');
    if (!digits) {
      inputEl.value = '';
      if (options.onChange) options.onChange(0);
      return;
    }
    const num = Number(digits);
    inputEl.value = num.toLocaleString('es-CO');
    if (options.onChange) options.onChange(num);
  });

  return {
    getRawValue: () => parseCurrency(inputEl.value),
    setRawValue: (val) => formatAndSet(val)
  };
}

/**
 * Converts a Date object to ISO local datetime string: YYYY-MM-DDTHH:mm
 * @param {Date} date 
 * @returns {string}
 */
export function toLocalDatetimeString(date) {
  if (!date || isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formats a date string into a friendly Spanish relative & absolute text.
 * @param {Date|string} dateVal 
 * @returns {string} e.g. "Sábado, 29 de Agosto 2026, 05:00 PM (en 24 horas)"
 */
export function formatExpirationFriendly(dateVal) {
  if (!dateVal) return '';
  const target = new Date(dateVal);
  if (isNaN(target.getTime())) return '';

  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const isPast = diffMs < 0;
  const absDiffHours = Math.abs(Math.round(diffMs / (1000 * 60 * 60)));
  const absDiffDays = Math.abs(Math.round(diffMs / (1000 * 60 * 60 * 24)));

  const dateStr = target.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const timeStr = target.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  let relativeStr = '';
  if (isPast) {
    relativeStr = absDiffHours < 24 ? `hace ${absDiffHours}h (Expirada)` : `hace ${absDiffDays} días (Expirada)`;
  } else {
    if (absDiffHours < 1) {
      const mins = Math.max(1, Math.round(diffMs / 60000));
      relativeStr = `en ${mins} min`;
    } else if (absDiffHours < 24) {
      relativeStr = `en ${absDiffHours} horas`;
    } else {
      relativeStr = `en ${absDiffDays} ${absDiffDays === 1 ? 'día' : 'días'}`;
    }
  }

  return {
    isPast,
    dateStr,
    timeStr,
    relativeStr,
    fullText: `${dateStr} a las ${timeStr} (${relativeStr})`
  };
}

/**
 * Enhances a datetime-local input with quick expiration preset buttons and a live preview badge.
 * @param {HTMLInputElement} inputEl 
 * @param {Object} options 
 */
export function setupDateTimePicker(inputEl, options = {}) {
  if (!inputEl) return null;

  const parent = inputEl.parentElement;
  if (!parent) return null;

  // Add calendar button inside wrapper if not already present
  if (!parent.classList.contains('datetime-input-wrapper')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'datetime-input-wrapper';
    parent.insertBefore(wrapper, inputEl);
    wrapper.appendChild(inputEl);

    const calBtn = document.createElement('button');
    calBtn.type = 'button';
    calBtn.className = 'datetime-calendar-btn';
    calBtn.title = 'Abrir selector de fecha y hora';
    calBtn.innerHTML = icons.calendar || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';

    calBtn.addEventListener('click', (e) => {
      e.preventDefault();
      try {
        if (typeof inputEl.showPicker === 'function') {
          inputEl.showPicker();
        } else {
          inputEl.focus();
        }
      } catch (err) {
        inputEl.focus();
      }
    });

    wrapper.appendChild(calBtn);
  }

  // Create or find live preview badge container
  let previewBadge = parent.parentElement?.querySelector('.datetime-preview-badge');
  if (!previewBadge) {
    previewBadge = document.createElement('div');
    previewBadge.className = 'datetime-preview-badge';
    parent.parentElement?.appendChild(previewBadge);
  }

  const updatePreview = () => {
    const val = inputEl.value;
    if (!val) {
      previewBadge.style.display = 'none';
      return;
    }
    const info = formatExpirationFriendly(val);
    if (!info) {
      previewBadge.style.display = 'none';
      return;
    }

    previewBadge.style.display = 'inline-flex';
    previewBadge.className = `datetime-preview-badge ${info.isPast ? 'expired' : 'soon'}`;
    previewBadge.innerHTML = `
      <span>${info.isPast ? '⚠️' : '⏳'}</span>
      <span>${info.fullText}</span>
    `;
  };

  // Create Quick Preset Pills container
  let presetsContainer = parent.parentElement?.querySelector('.datetime-presets-wrapper');
  if (!presetsContainer) {
    presetsContainer = document.createElement('div');
    presetsContainer.className = 'datetime-presets-wrapper';
    presetsContainer.innerHTML = `
      <span class="datetime-presets-label">⚡ Rápido:</span>
      <button type="button" class="datetime-preset-pill" data-hours="6">+6 Horas</button>
      <button type="button" class="datetime-preset-pill" data-hours="12">+12 Horas</button>
      <button type="button" class="datetime-preset-pill" data-hours="24">+24 Horas (1d)</button>
      <button type="button" class="datetime-preset-pill" data-hours="48">+48 Horas (2d)</button>
      <button type="button" class="datetime-preset-pill" data-hours="72">+3 Días</button>
      <button type="button" class="datetime-preset-pill" data-hours="168">+7 Días (1 sem)</button>
    `;

    // Insert presets right above or below input
    parent.parentElement?.appendChild(presetsContainer);

    presetsContainer.querySelectorAll('.datetime-preset-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const hours = Number(btn.getAttribute('data-hours') || 24);
        const targetDate = new Date(Date.now() + (hours * 3600 * 1000));
        
        // Round to clean minutes (e.g. current minute)
        targetDate.setSeconds(0);
        targetDate.setMilliseconds(0);

        inputEl.value = toLocalDatetimeString(targetDate);
        updatePreview();

        presetsContainer.querySelectorAll('.datetime-preset-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (options.onChange) options.onChange(inputEl.value);
      });
    });
  }

  // Listen to manual input changes
  inputEl.addEventListener('input', () => {
    updatePreview();
    if (presetsContainer) {
      presetsContainer.querySelectorAll('.datetime-preset-pill').forEach(b => b.classList.remove('active'));
    }
    if (options.onChange) options.onChange(inputEl.value);
  });

  inputEl.addEventListener('change', updatePreview);

  // Initial preview update
  updatePreview();

  return {
    updatePreview
  };
}
