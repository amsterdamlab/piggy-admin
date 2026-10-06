/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - MARKETPLACE SERVICE
   Direct sync with Supabase `marketplace` table & resilient persistence layer
   ========================================================================== */

import { getClient } from './supabase.js';

const STORAGE_KEY_OVERRIDES = 'piggy_marketplace_overrides';
const STORAGE_KEY_CUSTOM = 'piggy_marketplace_custom_items';

function getLocalOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OVERRIDES);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveLocalOverride(id, fields) {
  try {
    const overrides = getLocalOverrides();
    overrides[id] = { ...(overrides[id] || {}), ...fields, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
  } catch (e) {
    console.warn('Could not save local marketplace override', e);
  }
}

function removeLocalOverride(id) {
  try {
    const overrides = getLocalOverrides();
    delete overrides[id];
    localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(overrides));
  } catch (e) {
    console.warn('Could not remove local marketplace override', e);
  }
}

function getLocalCustomItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalCustomItem(item) {
  try {
    const items = getLocalCustomItems();
    const existingIdx = items.findIndex(i => i.id === item.id);
    if (existingIdx >= 0) {
      items[existingIdx] = { ...items[existingIdx], ...item };
    } else {
      items.unshift(item);
    }
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(items));
  } catch (e) {
    console.warn('Could not save custom marketplace item', e);
  }
}

function removeLocalCustomItem(id) {
  try {
    let items = getLocalCustomItems();
    items = items.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(items));
  } catch (e) {
    console.warn('Could not remove custom marketplace item', e);
  }
}

export const marketplaceService = {
  async getItems() {
    const client = getClient();

    // Purgar overrides obsoletos de localStorage para que nunca prevalezcan
    // datos locales desincronizados sobre el stock e inventario real de Supabase
    try {
      localStorage.removeItem(STORAGE_KEY_OVERRIDES);
    } catch (_) {}

    const customItems = getLocalCustomItems();
    let itemsFromDb = [];

    if (client) {
      try {
        const { data, error } = await client
          .from('marketplace')
          .select('*')
          .order('price', { ascending: true });

        if (!error && data && data.length > 0) {
          itemsFromDb = data.map((item) => {
            const extraRoi = Number(item.extra_roi || 0);
            const daysAdvanced = Number(item.days_advanced || 0);
            const daysRemaining = Number(item.days_remaining !== undefined && item.days_remaining !== null 
              ? item.days_remaining 
              : (144 - daysAdvanced));
            const stock = Number(item.stock !== undefined && item.stock !== null ? item.stock : 0);

            return {
              id: item.id,
              itemName: item.piggy_name || item.item_name || item.name || 'Piggy Especial',
              description: item.description || '',
              price: Number(item.price || 1000000),
              extraRoi,
              stock,
              imageUrl: item.image_url || '',
              badge: extraRoi > 0 
                ? `+${(extraRoi * 100).toFixed(0)}% ROI` 
                : (daysAdvanced > 0 ? `+${daysAdvanced}d Ahorro` : 'Estándar'),
              category: item.category || 'estandar',
              daysAdvanced,
              daysRemaining,
              currentWeight: Number(item.current_weight || 6.0),
              currentMonth: Number(item.current_month || 1),
              fixedEndDate: item.fixed_end_date || null
            };
          });
        }
        if (error) console.warn('Marketplace fetch error:', error.message);
      } catch (e) {
        console.error('Marketplace exception:', e);
      }
    }

    // Merge custom local items solo si no existen en la BD
    const existingIds = new Set(itemsFromDb.map(i => i.id));
    const uniqueCustom = customItems.filter(c => !existingIds.has(c.id));

    return [...itemsFromDb, ...uniqueCustom];
  },

  async createItem(item) {
    const client = getClient();
    const daysAdvanced = Number(item.daysAdvanced || 0);
    const daysRemaining = Number(item.daysRemaining || (144 - daysAdvanced));
    const currentMonth = Number(
      item.currentMonth || (daysAdvanced >= 120 ? 5 : daysAdvanced >= 90 ? 4 : daysAdvanced >= 60 ? 3 : daysAdvanced >= 30 ? 2 : 1)
    );
    const fixedEndDate = item.fixedEndDate || null;

    const payload = {
      piggy_name: item.itemName,
      description: item.description || '',
      price: Number(item.price || 1000000),
      extra_roi: Number(item.extraRoi || 0),
      stock: Number(item.stock || 10),
      image_url: item.imageUrl || '',
      category: item.category || 'estandar',
      days_advanced: daysAdvanced,
      days_remaining: daysRemaining,
      current_weight: Number(item.currentWeight || 6.0),
      current_month: currentMonth,
      fixed_end_date: fixedEndDate ? new Date(fixedEndDate).toISOString() : null
    };

    if (client) {
      try {
        const { data, error } = await client
          .from('marketplace')
          .insert([payload])
          .select();

        if (error) {
          console.error('Supabase insert warning:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true, data: data?.[0] };
      } catch (err) {
        console.error('Supabase insert exception:', err);
        return { success: false, error: err.message };
      }
    }

    const id = item.id || ('local-mk-' + Date.now());
    const itemData = {
      id,
      ...item,
      daysAdvanced,
      daysRemaining,
      currentMonth,
      fixedEndDate
    };
    saveLocalCustomItem(itemData);
    return { success: true, data: itemData };
  },

  async updateItem(id, item) {
    const client = getClient();
    const payload = {};

    if (item.itemName !== undefined) payload.piggy_name = item.itemName;
    if (item.description !== undefined) payload.description = item.description;
    if (item.price !== undefined) payload.price = Number(item.price);
    if (item.extraRoi !== undefined) payload.extra_roi = Number(item.extraRoi);
    if (item.stock !== undefined) payload.stock = Number(item.stock);
    if (item.imageUrl !== undefined) payload.image_url = item.imageUrl;
    if (item.category !== undefined) payload.category = item.category;
    if (item.daysAdvanced !== undefined) {
      const adv = Number(item.daysAdvanced);
      payload.days_advanced = adv;
      payload.days_remaining = Number(item.daysRemaining || (144 - adv));
      payload.current_month = adv >= 120 ? 5 : adv >= 90 ? 4 : adv >= 60 ? 3 : adv >= 30 ? 2 : 1;
    }
    if (item.currentWeight !== undefined) payload.current_weight = Number(item.currentWeight);
    if (item.fixedEndDate !== undefined) {
      payload.fixed_end_date = item.fixedEndDate ? new Date(item.fixedEndDate).toISOString() : null;
    }

    // Actualizar también en custom items si fuera local
    const customItems = getLocalCustomItems();
    if (customItems.some(c => c.id === id)) {
      saveLocalCustomItem({ id, ...item });
    }

    if (client) {
      try {
        const { error } = await client
          .from('marketplace')
          .update(payload)
          .eq('id', id);

        if (error) {
          console.error('Supabase update warning:', error.message);
          return { success: false, error: error.message };
        }

        // Limpiar cualquier override para mantener sincronización 1:1 con la BD
        removeLocalOverride(id);
        return { success: true };
      } catch (err) {
        console.error('Supabase update exception:', err);
        return { success: false, error: err.message };
      }
    }

    // Solo si no hay cliente (offline fallback)
    saveLocalOverride(id, item);
    return { success: true };
  },

  async deleteItem(id) {
    const client = getClient();
    removeLocalOverride(id);
    removeLocalCustomItem(id);

    if (client) {
      try {
        const { error } = await client.from('marketplace').delete().eq('id', id);
        if (error) {
          console.error('Supabase delete warning:', error.message);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err) {
        console.error('Supabase delete exception:', err);
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  }
};
