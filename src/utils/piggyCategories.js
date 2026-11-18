/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - PIGGY CATEGORIES & PLANS DEFINITIONS
   Single source of truth for Piggy categories, ROI bonuses, and cycle stages
   Synchronized 1:1 with Supabase database (`piggies`, `marketplace`, `exclusive_piggy_config`, `user_flash_missions`)
   ========================================================================== */

export const PIGGY_CATEGORIES = [
  // 1. Piggys Especiales con Beneficio Comercial Extra (Ciclo 5 meses / 152 días)
  {
    key: 'dorado',
    label: 'DORADO',
    shortLabel: 'DORADO',
    piggyLabel: 'PIGGY DORADO',
    badge: 'DORADO',
    benefitTitle: 'Beneficio Comercial +2% Extra',
    benefitDescription: 'Ciclo de 5 meses (152 días) con peso objetivo de 90 a 105 kg y +2% adicional.',
    missionTitle: 'MISIÓN FLASH',
    title: 'El Cerdito de Oro',
    group: 'Piggys Exclusivos & Beneficio Extra',
    extraRoiBonus: 0.02,
    cycleDays: 152,
    daysAdvanced: 0,
    defaultPrice: 1000000,
    defaultWeight: 6.0,
    defaultFinalWeight: 97.5,
    badgeClass: 'badge-warning',
    icon: '',
    description: 'Ciclo de 5 meses (152 días) con beneficio comercial adicional del +2%.'
  },
  {
    key: 'premium',
    label: 'PREMIUM',
    shortLabel: 'PREMIUM',
    piggyLabel: 'PIGGY PREMIUM',
    badge: 'PREMIUM',
    benefitTitle: 'Beneficio Comercial +4% Extra',
    benefitDescription: 'Ciclo de 5 meses (152 días) con peso objetivo de 105 a 120 kg y +4% adicional.',
    missionTitle: 'MISIÓN FLASH',
    title: 'Piggy Premium Exclusivo',
    group: 'Piggys Exclusivos & Beneficio Extra',
    extraRoiBonus: 0.04,
    cycleDays: 152,
    daysAdvanced: 0,
    defaultPrice: 1000000,
    defaultWeight: 6.0,
    defaultFinalWeight: 112.5,
    badgeClass: 'badge-warning',
    icon: '',
    description: 'Cerdito de alta gama con ciclo de 152 días y beneficio adicional del +4%.'
  },
  {
    key: 'estandar',
    label: 'ESTÁNDAR',
    shortLabel: 'ESTÁNDAR',
    piggyLabel: 'PIGGY ESTÁNDAR',
    badge: 'ESTÁNDAR',
    benefitTitle: 'Engorde Biológico Estándar',
    benefitDescription: 'Ciclo completo de engorde biológico en granja de 122 días (4 meses) hasta 75-90 kg.',
    missionTitle: 'MISIÓN FLASH',
    title: 'Adopta tu Piggy Estándar',
    group: 'Piggys Estándar & Aceleradores',
    extraRoiBonus: 0.00,
    cycleDays: 122,
    daysAdvanced: 0,
    defaultPrice: 1000000,
    defaultWeight: 6.0,
    defaultFinalWeight: 82.5,
    badgeClass: 'badge-neutral',
    icon: '',
    description: 'Cerdito estándar de engorde biológico de 122 días (4 meses).'
  },

  // 2. Piggys Aceleradores Vigentes V2 (Ahorro de hasta 30 días sobre ciclo de 122 días)
  {
    key: 'avanzado15',
    label: 'AVANZADO 15D',
    shortLabel: 'AVANZADO 15D',
    piggyLabel: 'AVANZADO 15D',
    badge: 'AVANZADO 15D',
    benefitTitle: 'Reducción de 15 días de espera',
    benefitDescription: 'Inicia en 15,4 kg con 107 días restantes sobre el ciclo de 122 días (75-90 kg).',
    missionTitle: 'MISIÓN FLASH',
    title: 'Acelera tu Crecimiento (15d)',
    group: 'Piggys Estándar & Aceleradores',
    extraRoiBonus: 0.00,
    cycleDays: 122,
    daysAdvanced: 15,
    defaultPrice: 1000000,
    defaultWeight: 15.4,
    defaultFinalWeight: 82.5,
    badgeClass: 'badge-info',
    icon: '',
    description: 'Inicia tu cerdito con 15 días de avance (107 días restantes).'
  },
  {
    key: 'avanzado30',
    label: 'AVANZADO 30D',
    shortLabel: 'AVANZADO 30D',
    piggyLabel: 'AVANZADO 30D',
    badge: 'AVANZADO 30D',
    benefitTitle: 'Reducción de 30 días de espera',
    benefitDescription: 'Inicia en 24,8 kg con 92 días restantes sobre el ciclo de 122 días (espera mínima 3 meses).',
    missionTitle: 'MISIÓN FLASH',
    title: 'Acelera tu Crecimiento (30d)',
    group: 'Piggys Estándar & Aceleradores',
    extraRoiBonus: 0.00,
    cycleDays: 122,
    daysAdvanced: 30,
    defaultPrice: 1000000,
    defaultWeight: 24.8,
    defaultFinalWeight: 82.5,
    badgeClass: 'badge-info',
    icon: '',
    description: 'Inicia tu cerdito en el día 30 ahorrando un mes de engorde (92 días restantes).'
  }
];

// Categorías históricas v1_legacy (solo lectura/edición de registros existentes, retiradas para nuevas compras)
export const LEGACY_PIGGY_CATEGORIES = [
  {
    key: 'plus',
    label: 'PLUS (Legacy)',
    shortLabel: 'PLUS',
    piggyLabel: 'PIGGY PLUS',
    badge: 'PLUS',
    benefitTitle: 'Beneficio Comercial +1% Extra',
    benefitDescription: 'Categoría histórica v1_legacy (144 días).',
    missionTitle: 'MISIÓN FLASH',
    title: 'Piggy Plus (Legacy)',
    group: 'Categorías Históricas (v1_legacy)',
    extraRoiBonus: 0.01,
    cycleDays: 144,
    daysAdvanced: 0,
    defaultPrice: 1000000,
    defaultWeight: 6.0,
    defaultFinalWeight: 85.0,
    badgeClass: 'badge-neutral',
    icon: '',
    isLegacy: true,
    description: 'Categoría histórica v1_legacy.'
  },
  {
    key: 'avanzado45',
    label: 'AVANZADO 45D (Legacy)',
    shortLabel: 'AVANZADO 45D',
    piggyLabel: 'AVANZADO 45D',
    badge: 'AVANZADO 45D',
    benefitTitle: 'Reducción de 45 días (Legacy)',
    benefitDescription: 'Categoría histórica v1_legacy (144 días).',
    missionTitle: 'MISIÓN FLASH',
    title: 'Avanzado 45D (Legacy)',
    group: 'Categorías Históricas (v1_legacy)',
    extraRoiBonus: 0.00,
    cycleDays: 144,
    daysAdvanced: 45,
    defaultPrice: 1000000,
    defaultWeight: 45.0,
    defaultFinalWeight: 85.0,
    badgeClass: 'badge-info',
    icon: '',
    isLegacy: true,
    description: 'Categoría histórica v1_legacy.'
  },
  {
    key: 'avanzado60',
    label: 'AVANZADO 60D (Legacy)',
    shortLabel: 'AVANZADO 60D',
    piggyLabel: 'AVANZADO 60D',
    badge: 'AVANZADO 60D',
    benefitTitle: 'Reducción de 60 días (Legacy)',
    benefitDescription: 'Categoría histórica v1_legacy (144 días).',
    missionTitle: 'MISIÓN FLASH',
    title: 'Avanzado 60D (Legacy)',
    group: 'Categorías Históricas (v1_legacy)',
    extraRoiBonus: 0.00,
    cycleDays: 144,
    daysAdvanced: 60,
    defaultPrice: 1000000,
    defaultWeight: 54.6,
    defaultFinalWeight: 85.0,
    badgeClass: 'badge-info',
    icon: '',
    isLegacy: true,
    description: 'Categoría histórica v1_legacy.'
  },
  {
    key: 'avanzado75',
    label: 'AVANZADO 75D (Legacy)',
    shortLabel: 'AVANZADO 75D',
    piggyLabel: 'AVANZADO 75D',
    badge: 'AVANZADO 75D',
    benefitTitle: 'Reducción de 75 días (Legacy)',
    benefitDescription: 'Categoría histórica v1_legacy (144 días).',
    missionTitle: 'MISIÓN FLASH',
    title: 'Avanzado 75D (Legacy)',
    group: 'Categorías Históricas (v1_legacy)',
    extraRoiBonus: 0.00,
    cycleDays: 144,
    daysAdvanced: 75,
    defaultPrice: 1000000,
    defaultWeight: 64.5,
    defaultFinalWeight: 85.0,
    badgeClass: 'badge-info',
    icon: '',
    isLegacy: true,
    description: 'Categoría histórica v1_legacy.'
  },
  {
    key: 'avanzado90',
    label: 'AVANZADO 90D (Legacy)',
    shortLabel: 'AVANZADO 90D',
    piggyLabel: 'AVANZADO 90D',
    badge: 'AVANZADO 90D',
    benefitTitle: 'Reducción de 90 días (Legacy)',
    benefitDescription: 'Categoría histórica v1_legacy (144 días).',
    missionTitle: 'MISIÓN FLASH',
    title: 'Avanzado 90D (Legacy)',
    group: 'Categorías Históricas (v1_legacy)',
    extraRoiBonus: 0.00,
    cycleDays: 144,
    daysAdvanced: 90,
    defaultPrice: 1000000,
    defaultWeight: 75.0,
    defaultFinalWeight: 85.0,
    badgeClass: 'badge-info',
    icon: '',
    isLegacy: true,
    description: 'Categoría histórica v1_legacy.'
  }
];

export const PIGGY_CATEGORIES_MAP = [...PIGGY_CATEGORIES, ...LEGACY_PIGGY_CATEGORIES].reduce((acc, cat) => {
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
    cycleDays: 122,
    daysAdvanced: 0,
    defaultPrice: 1000000,
    defaultWeight: 6.0,
    defaultFinalWeight: 82.5,
    badgeClass: 'badge-info',
    icon: '',
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

  // Incluir únicamente la categoría legacy si está seleccionada actualmente al editar un registro antiguo
  const categoriesToRender = [...PIGGY_CATEGORIES];
  const selectedLegacy = LEGACY_PIGGY_CATEGORIES.find(c => c.key === currentKey);
  if (selectedLegacy) {
    categoriesToRender.push(selectedLegacy);
  }

  // Agrupar categorías
  const groups = {};
  categoriesToRender.forEach(cat => {
    if (!groups[cat.group]) {
      groups[cat.group] = [];
    }
    
    // Si hay un override de precio en exclusive_piggy_config, anotarlo
    const exOverride = exclusivePriceMap[cat.key];
    const displayLabel = exOverride && exOverride.label 
      ? `${exOverride.label} (+${(exOverride.bonus * 100).toFixed(0)}%)` 
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
          data-cycle-days="${item.cycleDays || 122}"
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

/**
 * Calcula el peso biológico promedio proyectado en función de los días de avance
 * Sincronizado con `trg_auto_calc_marketplace_item` en Supabase (6.0 kg -> 82.5 kg en el ciclo)
 */
export function calculateWeightForDays(daysAdvanced, categoryKey = 'estandar') {
  const info = getPiggyCategoryInfo(categoryKey);
  const totalDays = Number(info?.cycleDays || 122);
  const days = Math.max(0, Math.min(totalDays, Number(daysAdvanced) || 0));
  if (days <= 0) return 6.0;
  return Number((6.0 + (days / totalDays) * (82.5 - 6.0)).toFixed(1));
}

/**
 * Calcula el porcentaje base de beneficio comercial según la cohorte (`v1_legacy` vs `v2_2026`)
 * y el número de cerditos activos en engorde del participante.
 */
export function calculatePiggyBaseRoi(planVersion = 'v2_2026', activeCount = 1) {
  const count = Math.max(1, Number(activeCount || 1));
  if (planVersion === 'v1_legacy') {
    if (count >= 3) return 0.10;
    if (count === 2) return 0.09;
    return 0.08;
  }
  if (count >= 3) return 0.14;
  if (count === 2) return 0.13;
  return 0.12;
}

/**
 * Calcula el retorno proyectado o congelado de un Piggy respetando `final_return_amount`,
 * `locked_base_roi`, `plan_version` y `extra_roi_bonus`.
 */
export function calculatePiggyProjectedReturn(piggy, activeCount = 1) {
  const amount = Number(piggy?.investmentAmount ?? piggy?.investment_amount ?? 1000000);
  const extraRoi = Number(piggy?.extraRoiBonus ?? piggy?.extra_roi_bonus ?? 0);
  const status = String(piggy?.status || 'engorde').toLowerCase();
  const planVersion = piggy?.planVersion || piggy?.plan_version || 'v1_legacy';
  const finalReturn = piggy?.finalReturnAmount ?? piggy?.final_return_amount;
  const lockedBase = piggy?.lockedBaseRoi ?? piggy?.locked_base_roi;

  if (status !== 'engorde' && finalReturn !== null && finalReturn !== undefined && Number(finalReturn) > 0) {
    const payout = Number(finalReturn);
    const totalRate = amount > 0 ? (payout - amount) / amount : 0;
    return {
      baseRoi: lockedBase !== null && lockedBase !== undefined ? Number(lockedBase) : Math.max(0, totalRate - extraRoi),
      extraRoi,
      totalRate,
      benefitAmount: Math.round(payout - amount),
      totalPayout: Math.round(payout)
    };
  }

  const baseRoi = (lockedBase !== null && lockedBase !== undefined)
    ? Number(lockedBase)
    : calculatePiggyBaseRoi(planVersion, activeCount);
  const totalRate = baseRoi + extraRoi;
  const totalPayout = Math.round(amount * (1 + totalRate));

  return {
    baseRoi,
    extraRoi,
    totalRate,
    benefitAmount: Math.round(totalPayout - amount),
    totalPayout
  };
}
