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
            badge: item.extra_roi > 0 ? `+${(Number(item.extra_roi) * 100).toFixed(0)}% ROI` : 'Estándar',
            category: item.category || 'estandar',
            daysAdvanced: item.days_advanced || 0,
            daysRemaining: item.days_remaining || 144,
            currentWeight: item.current_weight || 15.0
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
    const payload = {
      piggy_name: item.itemName,
      description: item.description || '',
      price: Number(item.price || 1000000),
      extra_roi: Number(item.extraRoi || 0),
      stock: Number(item.stock || 10),
      image_url: item.imageUrl || '',
      category: item.category || 'estandar',
      days_advanced: Number(item.daysAdvanced || 0),
      days_remaining: Number(item.daysRemaining || 144),
      current_weight: Number(item.currentWeight || 15.0),
      current_month: 1
    };

    if (client) {
      try {
        const { data, error } = await client
          .from('marketplace')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
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

    if (client) {
      try {
        const { data, error } = await client
          .from('marketplace')
          .update(payload)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
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
