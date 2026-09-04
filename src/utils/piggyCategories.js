/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - PIGGY CATEGORIES & PLANS DEFINITIONS
   Single source of truth for Piggy categories, ROI bonuses, and cycle stages
   Synchronized 1:1 with Supabase database (`piggies`, `marketplace`, `exclusive_piggy_config`, `user_flash_missions`)
   ========================================================================== */

export const PIGGY_CATEGORIES = [
  // 1. Piggys Especiales con Bono de Rentabilidad (ROI Extra)
  {
    key: 'dorado',
    label: 'DORADO',
    shortLabel: 'DORADO',
    piggyLabel: 'PIGGY DORADO',
    badge: 'DORADO',
    benefitTitle: 'Bono de Rentabilidad +2% Extra',
    benefitDescription: 'Mayor margen de ganancia al finalizar el ciclo de engorde.',
    missionTitle: 'MISIÓN FLASH',
    title: 'El Cerdito de Oro',
    group: 'Piggys Exclusivos & Bono ROI',
    extraRoiBonus: 0.02,
    daysAdvanced: 0,
    defaultPrice: 1300000,
    defaultWeight: 15.0,
    badgeClass: 'badge-warning',
    icon: '⚡',
    description: 'Corre a tomar esta mega oferta con bono extra de rentabilidad del +2% ROI.'
  },
  {
    key: 'premium',
    label: 'PREMIUM',
    shortLabel: 'PREMIUM',
    piggyLabel: 'PIGGY PREMIUM',
    badge: 'PREMIUM',
    benefitTitle: 'Bono de Rentabilidad +3% Extra',
    benefitDescription: 'Cerdito de alta gama con el máximo rendimiento de engorde.',
    missionTitle: 'MISIÓN FLASH',
    title: '¡Piggy Premium Exclusivo!',
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
    label: 'PLUS',
    shortLabel: 'PLUS',
    piggyLabel: 'PIGGY PLUS',
    badge: 'PLUS',
    benefitTitle: 'Bono de Rentabilidad +1% Extra',
    benefitDescription: 'Bono adicional de rentabilidad para tu granja.',
    missionTitle: 'MISIÓN FLASH',
    title: '¡Oferta Especial Piggy Plus!',
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
    label: 'ESTÁNDAR',
    shortLabel: 'ESTÁNDAR',
    piggyLabel: 'PIGGY ESTÁNDAR',
    badge: 'ESTÁNDAR',
    benefitTitle: 'Engorde Biológico Estándar',
    benefitDescription: 'Ciclo completo de engorde biológico en granja de 144 días.',
    missionTitle: 'MISIÓN FLASH',
    title: '¡Adopta tu Piggy Estándar!',
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
    label: 'AVANZADO 30D',
    shortLabel: 'AVANZADO 30D',
    piggyLabel: 'AVANZADO 30D',
    badge: 'AVANZADO 30D',
    benefitTitle: 'Reducción de 30 días de espera',
    benefitDescription: 'Inicia tu cerdito en el día 30 ahorrando un mes de engorde.',
    missionTitle: 'MISIÓN FLASH',
    title: '¡Acelera tu Crecimiento!',
    group: 'Piggys Aceleradores de Etapa',
    extraRoiBonus: 0.00,
    daysAdvanced: 30,
    defaultPrice: 1000000,
    defaultWeight: 34.8,
    badgeClass: 'badge-info',
    icon: '⚡',
    description: 'Inicia tu cerdito en el día 30 ahorrando un mes de engorde.'
  },
  {
    key: 'avanzado45',
    label: 'AVANZADO 45D',
    shortLabel: 'AVANZADO 45D',
    piggyLabel: 'AVANZADO 45D',
    badge: 'AVANZADO 45D',
    benefitTitle: 'Reducción de 45 días de espera',
    benefitDescription: 'Inicia tu cerdito en el día 45 ahorrando mes y medio de engorde.',
    missionTitle: 'MISIÓN FLASH',
    title: '¡Acelera tu Crecimiento!',
    group: 'Piggys Aceleradores de Etapa',
    extraRoiBonus: 0.00,
    daysAdvanced: 45,
    defaultPrice: 1100000,
    defaultWeight: 45.0,
    badgeClass: 'badge-info',
    icon: '⚡',
    description: 'Inicia tu cerdito en el día 45 ahorrando mes y medio de engorde.'
  },
  {
    key: 'avanzado60',
    label: 'AVANZADO 60D',
    shortLabel: 'AVANZADO 60D',
    piggyLabel: 'AVANZADO 60D',
    badge: 'AVANZADO 60D',
    benefitTitle: 'Reducción de 60 días de espera',
    benefitDescription: 'Inicia tu cerdito en el día 60 ahorrando dos meses de engorde.',
    missionTitle: 'MISIÓN FLASH',
    title: '¡Acelera tu Crecimiento!',
    group: 'Piggys Aceleradores de Etapa',
    extraRoiBonus: 0.00,
    daysAdvanced: 60,
    defaultPrice: 1000000,
    defaultWeight: 54.6,
    badgeClass: 'badge-info',
    icon: '⚡',
    description: 'Inicia tu cerdito en el día 60 ahorrando dos meses de engorde.'
  },
  {
    key: 'avanzado75',
    label: 'AVANZADO 75D',
    shortLabel: 'AVANZADO 75D',
    piggyLabel: 'AVANZADO 75D',
    badge: 'AVANZADO 75D',
    benefitTitle: 'Reducción de 75 días de espera',
    benefitDescription: 'Inicia tu cerdito en el día 75 ahorrando dos meses y medio.',
    missionTitle: 'MISIÓN FLASH',
    title: '¡Acelera tu Crecimiento!',
    group: 'Piggys Aceleradores de Etapa',
    extraRoiBonus: 0.00,
    daysAdvanced: 75,
    defaultPrice: 1200000,
    defaultWeight: 64.5,
    badgeClass: 'badge-info',
    icon: '⚡',
    description: 'Inicia tu cerdito en el día 75 ahorrando dos meses y medio.'
  },
  {
    key: 'avanzado90',
    label: 'AVANZADO 90D',
    shortLabel: 'AVANZADO 90D',
    piggyLabel: 'AVANZADO 90D',
    badge: 'AVANZADO 90D',
    benefitTitle: 'Reducción de 90 días de espera',
    benefitDescription: 'Inicia tu cerdito en el día 90 ahorrando tres meses de engorde.',
    missionTitle: 'MISIÓN FLASH',
    title: '¡Acelera tu Crecimiento!',
    group: 'Piggys Aceleradores de Etapa',
    extraRoiBonus: 0.00,
    daysAdvanced: 90,
    defaultPrice: 1300000,
    defaultWeight: 75.0,
    badgeClass: 'badge-info',
    icon: '⚡',
    description: 'Inicia tu cerdito en el día 90 ahorrando tres meses de engorde.'
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
    label: normalized.toUpperCase(),
    shortLabel: normalized.toUpperCase(),
    piggyLabel: normalized.toUpperCase(),
    badge: normalized.toUpperCase(),
    benefitTitle: 'Beneficio Especial de Granja',
    benefitDescription: 'Oferta temporal con beneficios exclusivos de producción.',
    missionTitle: 'MISIÓN FLASH',
    title: `Misión Flash: ${normalized.toUpperCase()}`,
    group: 'Otras Categorías',
    extraRoiBonus: 0,
    daysAdvanced: 0,
    defaultPrice: 1000000,
    defaultWeight: 15.0,
    badgeClass: 'badge-info',
    icon: '⚡',
    description: 'Oferta especial por tiempo limitado.'
  };
}

/**
 * Genera el badge HTML para una categoría
 */
export function getPiggyCategoryBadge(key, customLabel = null) {
  const info = getPiggyCategoryInfo(key);
  const label = (customLabel || info.badge || info.shortLabel || info.label || key).toUpperCase();
  return `
    <span class="badge ${info.badgeClass}" style="font-weight: 800; text-transform: uppercase; font-size: 0.72rem; padding: 2px 8px; margin-bottom: 2px; display: inline-block;">
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
          data-piggy-label="${item.piggyLabel}"
          data-badge="${item.badge}"
          data-benefit-title="${item.benefitTitle}"
          data-benefit-desc="${item.benefitDescription}"
          data-mission-title="${item.missionTitle}"
          data-title="${item.title}"
          data-icon="${item.icon}"
        >
          ${item.displayLabel}
        </option>
      `).join('')}
    </optgroup>
  `).join('');
}
