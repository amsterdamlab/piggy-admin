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
    const overrides = getLocalOverrides();
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
            const override = overrides[item.id] || {};
            const itemName = override.itemName !== undefined 
              ? override.itemName 
              : (item.piggy_name || item.item_name || item.name || 'Piggy Especial');
            const description = override.description !== undefined ? override.description : (item.description || '');
            const price = override.price !== undefined ? Number(override.price) : Number(item.price || 1000000);
            const extraRoi = override.extraRoi !== undefined ? Number(override.extraRoi) : Number(item.extra_roi || 0);
            const stock = override.stock !== undefined ? Number(override.stock) : Number(item.stock || 0);
            const imageUrl = override.imageUrl !== undefined ? override.imageUrl : (item.image_url || '');
            const category = override.category !== undefined ? override.category : (item.category || 'estandar');
            const daysAdvanced = override.daysAdvanced !== undefined ? Number(override.daysAdvanced) : Number(item.days_advanced || 0);
            const daysRemaining = override.daysRemaining !== undefined ? Number(override.daysRemaining) : Number(item.days_remaining || (144 - daysAdvanced));
            const currentWeight = override.currentWeight !== undefined ? Number(override.currentWeight) : Number(item.current_weight || 15.0);
            const currentMonth = override.currentMonth !== undefined ? Number(override.currentMonth) : Number(item.current_month || 1);

            return {
              id: item.id,
              itemName,
              description,
              price,
              extraRoi,
              stock,
              imageUrl,
              badge: extraRoi > 0 
                ? `+${(extraRoi * 100).toFixed(0)}% ROI` 
                : (daysAdvanced > 0 ? `+${daysAdvanced}d Ahorro` : 'Estándar'),
              category,
              daysAdvanced,
              daysRemaining,
              currentWeight,
              currentMonth
            };
          });
        }
        if (error) console.warn('Marketplace fetch error:', error.message);
      } catch (e) {
        console.error('Marketplace exception:', e);
      }
    }

    // Merge custom local items that might not be in DB yet
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

    const id = item.id || ('local-mk-' + Date.now());
    const itemData = {
      id,
      itemName: item.itemName,
      description: item.description || '',
      price: Number(item.price || 1000000),
      extraRoi: Number(item.extraRoi || 0),
      stock: Number(item.stock || 10),
      imageUrl: item.imageUrl || '',
      category: item.category || 'estandar',
      daysAdvanced,
      daysRemaining,
      currentWeight: Number(item.currentWeight || 15.0),
      currentMonth,
      badge: Number(item.extraRoi || 0) > 0 
        ? `+${(Number(item.extraRoi) * 100).toFixed(0)}% ROI` 
        : (daysAdvanced > 0 ? `+${daysAdvanced}d Ahorro` : 'Estándar')
    };

    // Save to local custom items
    saveLocalCustomItem(itemData);

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
      current_weight: Number(item.currentWeight || 15.0),
      current_month: currentMonth
    };

    if (client) {
      try {
        await client.from('marketplace').insert([payload]);
      } catch (err) {
        console.warn('Supabase insert warning:', err.message);
      }
    }

    return { success: true, data: itemData };
  },

  async updateItem(id, item) {
    const client = getClient();
    const payload = {};
    const localUpdates = {};

    if (item.itemName !== undefined) {
      payload.piggy_name = item.itemName;
      localUpdates.itemName = item.itemName;
    }
    if (item.description !== undefined) {
      payload.description = item.description;
      localUpdates.description = item.description;
    }
    if (item.price !== undefined) {
      payload.price = Number(item.price);
      localUpdates.price = Number(item.price);
    }
    if (item.extraRoi !== undefined) {
      payload.extra_roi = Number(item.extraRoi);
      localUpdates.extraRoi = Number(item.extraRoi);
    }
    if (item.stock !== undefined) {
      payload.stock = Number(item.stock);
      localUpdates.stock = Number(item.stock);
    }
    if (item.imageUrl !== undefined) {
      payload.image_url = item.imageUrl;
      localUpdates.imageUrl = item.imageUrl;
    }
    if (item.category !== undefined) {
      payload.category = item.category;
      localUpdates.category = item.category;
    }
    if (item.daysAdvanced !== undefined) {
      const adv = Number(item.daysAdvanced);
      payload.days_advanced = adv;
      payload.days_remaining = Number(item.daysRemaining || (144 - adv));
      payload.current_month = adv >= 120 ? 5 : adv >= 90 ? 4 : adv >= 60 ? 3 : adv >= 30 ? 2 : 1;

      localUpdates.daysAdvanced = adv;
      localUpdates.daysRemaining = payload.days_remaining;
      localUpdates.currentMonth = payload.current_month;
    }
    if (item.currentWeight !== undefined) {
      payload.current_weight = Number(item.currentWeight);
      localUpdates.currentWeight = Number(item.currentWeight);
    }

    // 1. Save locally so changes reflect immediately and persist in the admin
    saveLocalOverride(id, localUpdates);

    // Also update custom item if it exists
    const customItems = getLocalCustomItems();
    if (customItems.some(c => c.id === id)) {
      saveLocalCustomItem({ id, ...localUpdates });
    }

    // 2. Sync to Supabase in background
    if (client) {
      try {
        await client
          .from('marketplace')
          .update(payload)
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase update warning:', err.message);
      }
    }

    return { success: true };
  },

  async deleteItem(id) {
    const client = getClient();
    removeLocalOverride(id);
    removeLocalCustomItem(id);

    if (client) {
      try {
        await client.from('marketplace').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete warning:', err.message);
      }
    }
    return { success: true };
  }
};
