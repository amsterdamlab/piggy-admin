/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - MARKETPLACE SERVICE
   Direct sync with Supabase `marketplace` table
   ========================================================================== */

import { getClient } from './supabase.js';

export const marketplaceService = {
  async getItems() {
    const client = getClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('marketplace')
          .select('*')
          .order('price', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((item) => ({
            id: item.id,
            itemName: item.piggy_name || item.item_name || item.name || 'Piggy Especial',
            description: item.description || '',
            price: Number(item.price || 1000000),
            extraRoi: Number(item.extra_roi || 0),
            stock: Number(item.stock || 0),
            imageUrl: item.image_url || '',
            badge: item.extra_roi > 0 
              ? `+${(Number(item.extra_roi) * 100).toFixed(0)}% ROI` 
              : (Number(item.days_advanced || 0) > 0 ? `+${item.days_advanced}d Ahorro` : 'Estándar'),
            category: item.category || 'estandar',
            daysAdvanced: Number(item.days_advanced || 0),
            daysRemaining: Number(item.days_remaining || 144),
            currentWeight: Number(item.current_weight || 15.0),
            currentMonth: Number(item.current_month || 1)
          }));
        }
        if (error) console.warn('Marketplace fetch error:', error.message);
      } catch (e) {
        console.error('Marketplace exception:', e);
      }
    }

    return [];
  },

  async createItem(item) {
    const client = getClient();
    const daysAdvanced = Number(item.daysAdvanced || 0);
    const daysRemaining = Number(item.daysRemaining || (144 - daysAdvanced));
    const currentMonth = Number(
      item.currentMonth || (daysAdvanced >= 120 ? 5 : daysAdvanced >= 90 ? 4 : daysAdvanced >= 60 ? 3 : daysAdvanced >= 30 ? 2 : 1)
    );

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
        const { error } = await client
          .from('marketplace')
          .insert([payload]);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    return { success: false, error: 'No client' };
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

    if (client) {
      try {
        const { error } = await client
          .from('marketplace')
          .update(payload)
          .eq('id', id);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    return { success: false, error: 'No client' };
  },

  async deleteItem(id) {
    const client = getClient();
    if (client) {
      try {
        const { error } = await client.from('marketplace').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'No client' };
  }
};
