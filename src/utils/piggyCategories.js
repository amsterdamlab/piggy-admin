/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - PIGGY CATEGORIES & PLANS DEFINITIONS
   Single source of truth for Piggy categories, ROI bonuses, and cycle stages
   Synchronized 1:1 with Supabase database (`piggies`, `marketplace`, `exclusive_piggy_config`, `user_flash_missions`)
   ========================================================================== */

export const PIGGY_CATEGORIES = [
  // 1. Piggys Especiales con Bono de Rentabilidad (ROI Extra)
  {
    key: 'dorado',
    label: 'Piggy Dorado (+2% ROI)',
    shortLabel: 'Dorado',
    group: 'Piggys Exclusivos & Bono ROI',
    extraRoiBonus: 0.02,
    daysAdvanced: 0,
    defaultPrice: 1300000,
    defaultWeight: 15.0,
    badgeClass: 'badge-warning',
    icon: '⚡',
    description: 'Cerdito exclusivo con bono de rentabilidad extra del +2% ROI.'
  },
  {
    key: 'premium',
    label: 'Piggy Premium (+3% ROI)',
    shortLabel: 'Premium',
    group: 'Piggys Exclusivos & Bono ROI',
    extraRoiBonus: 0.03,
    daysAdvanced: 0,
    defaultPrice: 1500000,
    defaultWeight: 15.0,
    badgeClass: 'badge-warning',
    icon: '💎',
    description: 'Cerdito de alta gama con bono de rentabilidad extra del +3% ROI.'
  },
  {
    key: 'plus',
    label: 'Piggy Plus (+1% ROI)',
    shortLabel: 'Plus',
    group: 'Piggys Exclusivos & Bono ROI',
    extraRoiBonus: 0.01,
    daysAdvanced: 0,
    defaultPrice: 1200000,
    defaultWeight: 15.0,
    badgeClass: 'badge-warning',
    icon: '✨',
    description: 'Cerdito especial con bono de rentabilidad extra del +1% ROI.'
  },
  {
    key: 'estandar',
    label: 'Piggy Estándar (Base 8-10%)',
    shortLabel: 'Estándar',
    group: 'Piggys Exclusivos & Bono ROI',
    extraRoiBonus: 0.00,
    daysAdvanced: 0,
    defaultPrice: 1000000,
    defaultWeight: 15.0,
    badgeClass: 'badge-neutral',
    icon: '🐷',
    description: 'Cerdito estándar de engorde biológico de 144 días.'
  },

  // 2. Piggys Aceleradores (Ahorro de días de engorde en granja)
  {
    key: 'avanzado30',
    label: 'Avanzado 30 Días (+30d Ahorro)',
    shortLabel: 'Avanzado 30d',
    group: 'Piggys Aceleradores de Etapa',
    extraRoiBonus: 0.00,
    daysAdvanced: 30,
    defaultPrice: 1000000,
    defaultWeight: 34.8,
    badgeClass: 'badge-info',
    icon: '🚀',
    description: 'Adopta un cerdito en etapa mes 2, ahorrando 30 días de engorde.'
  },
  {
    key: 'avanzado45',
    label: 'Avanzado 45 Días (+45d Ahorro)',
    shortLabel: 'Avanzado 45d',
    group: 'Piggys Aceleradores de Etapa',
    extraRoiBonus: 0.00,
    daysAdvanced: 45,
    defaultPrice: 1100000,
    defaultWeight: 45.0,
    badgeClass: 'badge-info',
    icon: '🚀',
    description: 'Adopta un cerdito en etapa avanzada, ahorrando 45 días de engorde.'
  },
  {
    key: 'avanzado60',
    label: 'Avanzado 60 Días (+60d Ahorro)',
    shortLabel: 'Avanzado 60d',
    group: 'Piggys Aceleradores de Etapa',
    extraRoiBonus: 0.00,
    daysAdvanced: 60,
    defaultPrice: 1000000,
    defaultWeight: 54.6,
    badgeClass: 'badge-info',
    icon: '🚀',
    description: 'Adopta un cerdito en tercer mes, ahorrando 60 días de espera.'
  },
  {
    key: 'avanzado75',
    label: 'Avanzado 75 Días (+75d Ahorro)',
    shortLabel: 'Avanzado 75d',
    group: 'Piggys Aceleradores de Etapa',
    extraRoiBonus: 0.00,
    daysAdvanced: 75,
    defaultPrice: 1200000,
    defaultWeight: 64.5,
    badgeClass: 'badge-info',
    icon: '🚀',
    description: 'Adopta un cerdito en tercer mes avanzado, ahorrando 75 días.'
  },
  {
    key: 'avanzado90',
    label: 'Avanzado 90 Días (+90d Ahorro)',
    shortLabel: 'Avanzado 90d',
    group: 'Piggys Aceleradores de Etapa',
    extraRoiBonus: 0.00,
    daysAdvanced: 90,
    defaultPrice: 1300000,
    defaultWeight: 75.0,
    badgeClass: 'badge-info',
    icon: '🚀',
    description: 'Adopta un cerdito en etapa final mes 4, ahorrando 90 días.'
  }
];

export const PIGGY_CATEGORIES_MAP = PIGGY_CATEGORIES.reduce((acc, cat) => {
  acc[cat.key.toLowerCase()] = cat;
  return acc;
}, {});

/**
 * Obtiene los metadatos de una categoría por su clave normalizada
 */
export function getPiggyCategoryInfo(key) {
  if (!key) return PIGGY_CATEGORIES[0];
  const normalized = String(key).trim().toLowerCase();
  if (PIGGY_CATEGORIES_MAP[normalized]) {
    return PIGGY_CATEGORIES_MAP[normalized];
  }

  // Fallback con formato inteligente si llega una clave no registrada
  return {
    key: normalized,
    label: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    shortLabel: normalized.toUpperCase(),
    group: 'Otras Categorías',
    extraRoiBonus: 0,
    daysAdvanced: 0,
    defaultPrice: 1000000,
    defaultWeight: 15.0,
    badgeClass: 'badge-info',
    icon: '🐷',
    description: ''
  };
}

/**
 * Genera el badge HTML para una categoría
 */
export function getPiggyCategoryBadge(key, customLabel = null) {
  const info = getPiggyCategoryInfo(key);
  const label = customLabel || info.shortLabel || info.label;
  return `
    <span class="badge ${info.badgeClass}" style="font-weight: 800; text-transform: uppercase; font-size: 0.72rem; padding: 1px 7px; margin-bottom: 3px; display: inline-block;">
      ${label}
    </span>
  `;
}

/**
 * Renderiza el conjunto de opciones para un elemento <select> agrupado por categoría
 * @param {string} selectedKey - Clave actualmente seleccionada
 * @param {Array} exclusiveConfigs - Lista opcional de configs desde la tabla exclusive_piggy_config
 */
export function renderCategorySelectOptions(selectedKey = 'dorado', exclusiveConfigs = []) {
  const currentKey = String(selectedKey || 'dorado').trim().toLowerCase();
  
  // Mapa de configuraciones exclusivas activas en DB para enriquecer precios
  const exclusivePriceMap = {};
  if (Array.isArray(exclusiveConfigs)) {
    exclusiveConfigs.forEach(c => {
      if (c.piggy_type) {
        exclusivePriceMap[c.piggy_type.toLowerCase()] = {
          price: Number(c.price || 0),
          bonus: Number(c.extra_roi_bonus || 0),
          label: c.piggy_label
        };
      }
    });
  }

  // Agrupar categorías
  const groups = {};
  PIGGY_CATEGORIES.forEach(cat => {
    if (!groups[cat.group]) {
      groups[cat.group] = [];
    }
    
    // Si hay un override de precio en exclusive_piggy_config, anotarlo
    const exOverride = exclusivePriceMap[cat.key];
    const displayLabel = exOverride && exOverride.label 
      ? `${exOverride.label} (+${(exOverride.bonus * 100).toFixed(0)}% ROI)` 
      : cat.label;

    groups[cat.group].push({
      ...cat,
      displayLabel
    });
  });

  return Object.entries(groups).map(([groupName, items]) => `
    <optgroup label="${groupName}">
      ${items.map(item => `
        <option 
          value="${item.key}" 
          ${item.key === currentKey ? 'selected' : ''}
          data-price="${exclusivePriceMap[item.key]?.price || item.defaultPrice}"
          data-roi="${exclusivePriceMap[item.key]?.bonus !== undefined ? exclusivePriceMap[item.key].bonus : item.extraRoiBonus}"
          data-days="${item.daysAdvanced}"
          data-weight="${item.defaultWeight}"
        >
          ${item.displayLabel}
        </option>
      `).join('')}
    </optgroup>
  `).join('');
}
