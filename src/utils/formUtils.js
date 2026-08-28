/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - FORM & CURRENCY UTILITIES
   Masking and currency formatting standard without "COP" suffix.
   ========================================================================== */

import { icons } from '../icons.js';

/**
 * Formats a numeric value into Colombian Pesos string format: $1.000.000
 * @param {number|string} value 
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '$0';
  const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, '')) || 0 : value;
  return `$${Math.round(num).toLocaleString('es-CO')}`;
}

/**
 * Extracts raw integer/float value from a formatted string (e.g. "$1.500.000" -> 1500000)
 * @param {string|number} value 
 * @returns {number}
 */
export function parseCurrency(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9-]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * Attaches real-time Colombian Pesos formatting to an input element.
 * @param {HTMLInputElement} inputEl 
 * @param {Object} options 
 */
export function setupCurrencyInput(inputEl, options = {}) {
  if (!inputEl) return;

  const updateFormattedValue = () => {
    const rawVal = parseCurrency(inputEl.value);
    if (inputEl.value.trim() === '') {
      inputEl.value = '';
      if (options.onValueChange) options.onValueChange(0);
      return;
    }
    inputEl.value = formatCurrency(rawVal);
    if (options.onValueChange) options.onValueChange(rawVal);
  };

  inputEl.addEventListener('input', (e) => {
    const cursorPosition = inputEl.selectionStart;
    const oldLength = inputEl.value.length;
    const rawVal = parseCurrency(inputEl.value);
    
    if (rawVal === 0 && inputEl.value.replace(/[^0-9]/g, '') === '') {
      inputEl.value = '';
    } else {
      inputEl.value = formatCurrency(rawVal);
    }

    const newLength = inputEl.value.length;
    const newPosition = Math.max(1, cursorPosition + (newLength - oldLength));
    inputEl.setSelectionRange(newPosition, newPosition);

    if (options.onValueChange) {
      options.onValueChange(rawVal);
    }
  });

  inputEl.addEventListener('blur', updateFormattedValue);

  if (inputEl.value) {
    updateFormattedValue();
  }
}

/**
 * Enhances a datetime-local input with a clean blue calendar button and opens the native picker.
 * @param {HTMLInputElement} inputEl 
 * @param {Object} options 
 */
export function setupDateTimePicker(inputEl, options = {}) {
  if (!inputEl) return null;

  inputEl.type = 'datetime-local';
  inputEl.style.cursor = 'pointer';

  let wrapper = inputEl.closest('.datetime-input-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.className = 'datetime-input-wrapper';
    inputEl.parentNode.insertBefore(wrapper, inputEl);
    wrapper.appendChild(inputEl);
  }

  // Ensure button exists inside wrapper
  let calBtn = wrapper.querySelector('.datetime-calendar-btn');
  if (!calBtn) {
    calBtn = document.createElement('button');
    calBtn.type = 'button';
    calBtn.className = 'datetime-calendar-btn';
    calBtn.title = 'Abrir selector de fecha y hora';
    calBtn.innerHTML = icons.calendar || `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    wrapper.appendChild(calBtn);
  }

  const triggerPicker = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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

  calBtn.onclick = triggerPicker;
  inputEl.onclick = triggerPicker;

  if (options.onChange) {
    inputEl.onchange = () => options.onChange(inputEl.value);
  }

  return {
    input: inputEl,
    button: calBtn,
    wrapper
  };
}
