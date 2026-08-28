/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - FORM UTILS
   Helpers for Currency Formatting (thousands separator) & DateTime Mini Picker Button
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
 * Enhances a datetime-local input with a clean blue calendar button and opens the native picker.
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
    calBtn.title = 'Abrir calendario';
    calBtn.innerHTML = icons.calendar || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>';

    const triggerPicker = (e) => {
      if (e) e.preventDefault();
      try {
        if (typeof inputEl.showPicker === 'function') {
          inputEl.showPicker();
        } else {
          inputEl.focus();
        }
      } catch (err) {
        inputEl.focus();
      }
    };

    calBtn.addEventListener('click', triggerPicker);
    inputEl.addEventListener('click', triggerPicker);

    wrapper.appendChild(calBtn);
  }

  if (options.onChange) {
    inputEl.addEventListener('change', () => options.onChange(inputEl.value));
  }

  return {
    input: inputEl
  };
}
