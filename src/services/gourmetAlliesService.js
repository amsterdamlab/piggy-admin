/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - GOURMET & ALLIES SERVICE
   Direct sync with Supabase `gourmet_offers` and `allies` tables
   ========================================================================== */

import { getClient } from './supabase.js';

export const gourmetAlliesService = {
  async getGourmetProducts() {
    const client = getClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('gourmet_offers')
          .select('*')
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: Number(p.price || 0),
            originalPrice: Number(p.original_price || p.price || 0),
            pointsPrice: Math.round(Number(p.price || 0) / 350),
            stock: 20,
            imageUrl: p.image_url || '',
            category: p.tag || 'Cortes Especiales',
            tag: p.tag || '',
            emoji: p.emoji || '🥩',
            isActive: p.is_active !== undefined ? p.is_active : true,
            sortOrder: p.sort_order || 1
          }));
        }
        if (error) console.warn('Gourmet offers error:', error.message);
      } catch (e) {
        console.error('Gourmet exception:', e);
      }
    }

    return [];
  },

  async createGourmetProduct(product) {
    const client = getClient();
    const payload = {
      name: product.name,
      description: product.description || '',
      price: Number(product.price || 0),
      original_price: Number(product.originalPrice || product.price || 0),
      image_url: product.imageUrl || '',
      tag: product.tag || product.category || '✨ Exclusivo Granja',
      emoji: product.emoji || '🥩',
      is_active: true,
      sort_order: Number(product.sortOrder || 1)
    };

    if (client) {
      try {
        const { error } = await client
          .from('gourmet_offers')
          .insert([payload]);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    return { success: false, error: 'No client' };
  },

  async updateGourmetProduct(id, product) {
    const client = getClient();
    const payload = {};
    if (product.name !== undefined) payload.name = product.name;
    if (product.description !== undefined) payload.description = product.description;
    if (product.price !== undefined) payload.price = Number(product.price);
    if (product.originalPrice !== undefined) payload.original_price = Number(product.originalPrice);
    if (product.imageUrl !== undefined) payload.image_url = product.imageUrl;
    if (product.tag !== undefined) payload.tag = product.tag;
    if (product.category !== undefined) payload.tag = product.category;
    if (product.isActive !== undefined) payload.is_active = product.isActive;

    if (client) {
      try {
        const { error } = await client
          .from('gourmet_offers')
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

  async deleteGourmetProduct(id) {
    const client = getClient();
    if (client) {
      try {
        const { error } = await client.from('gourmet_offers').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'No client' };
  },

  async getAllies() {
    const client = getClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('allies')
          .select('*')
          .order('display_order', { ascending: true, nullsFirst: false })
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((a) => ({
            id: a.id,
            name: a.name || '',
            category: a.category || 'General',
            location: a.location || '',
            imageUrl: a.image_url || '',
            description: a.description || '',
            specialty: a.specialty || '',
            benefit: a.benefit || '',
            phone: a.phone || '',
            address: a.address || '',
            displayOrder: a.display_order !== null && a.display_order !== undefined ? Number(a.display_order) : null
          }));
        }
        if (error) console.warn('Allies error:', error.message);
      } catch (e) {
        console.error('Allies exception:', e);
      }
    }

    return [];
  },

  async createAlly(ally) {
    const client = getClient();
    const payload = {
      name: ally.name ? ally.name.trim() : '',
      category: ally.category ? ally.category.trim() : 'Comercio',
      location: ally.location ? ally.location.trim() : '',
      image_url: ally.imageUrl ? ally.imageUrl.trim() : '',
      description: ally.description ? ally.description.trim() : '',
      specialty: ally.specialty ? ally.specialty.trim() : '',
      benefit: ally.benefit ? ally.benefit.trim() : '',
      phone: ally.phone ? ally.phone.trim() : '',
      address: ally.address ? ally.address.trim() : '',
      display_order: ally.displayOrder !== null && ally.displayOrder !== undefined && ally.displayOrder !== ''
        ? Number(ally.displayOrder)
        : null
    };

    if (client) {
      try {
        const { error } = await client
          .from('allies')
          .insert([payload]);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    return { success: false, error: 'No client' };
  },

  async updateAlly(id, ally) {
    const client = getClient();
    const payload = {};
    if (ally.name !== undefined) payload.name = ally.name.trim();
    if (ally.category !== undefined) payload.category = ally.category.trim();
    if (ally.location !== undefined) payload.location = ally.location.trim();
    if (ally.imageUrl !== undefined) payload.image_url = ally.imageUrl.trim();
    if (ally.description !== undefined) payload.description = ally.description.trim();
    if (ally.specialty !== undefined) payload.specialty = ally.specialty.trim();
    if (ally.benefit !== undefined) payload.benefit = ally.benefit.trim();
    if (ally.phone !== undefined) payload.phone = ally.phone.trim();
    if (ally.address !== undefined) payload.address = ally.address.trim();
    if (ally.displayOrder !== undefined) {
      payload.display_order = ally.displayOrder !== null && ally.displayOrder !== undefined && ally.displayOrder !== ''
        ? Number(ally.displayOrder)
        : null;
    }

    if (client) {
      try {
        const { error } = await client
          .from('allies')
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

  async deleteAlly(id) {
    const client = getClient();
    if (client) {
      try {
        const { error } = await client.from('allies').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'No client' };
  }
};
