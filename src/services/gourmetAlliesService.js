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
        const { data, error } = await client
          .from('gourmet_offers')
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
        const { data, error } = await client
          .from('gourmet_offers')
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
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          return data.map((a) => ({
            id: a.id,
            name: a.name,
            category: a.category || 'Restaurante',
            location: a.location || 'Colombia',
            logoUrl: a.logo_url || a.image_url || '',
            imageUrl: a.image_url || '',
            discountInfo: a.discount_info || a.benefit || 'Descuento exclusivo',
            description: a.description || '',
            specialty: a.specialty || '',
            phone: a.phone || '',
            address: a.address || ''
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
      name: ally.name,
      category: ally.category || 'Restaurante',
      location: ally.location || 'Colombia',
      logo_url: ally.logoUrl || null,
      image_url: ally.logoUrl || ally.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      discount_info: ally.discountInfo || '10% de descuento',
      benefit: ally.discountInfo || '10% de descuento',
      description: ally.description || 'Aliado oficial de la red Piggy.',
      specialty: ally.specialty || ally.category || 'Gourmet',
      phone: ally.phone || '300 000 0000',
      address: ally.address || ally.location || 'Colombia'
    };

    if (client) {
      try {
        const { data, error } = await client
          .from('allies')
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

  async updateAlly(id, ally) {
    const client = getClient();
    const payload = {};
    if (ally.name !== undefined) payload.name = ally.name;
    if (ally.category !== undefined) payload.category = ally.category;
    if (ally.location !== undefined) payload.location = ally.location;
    if (ally.logoUrl !== undefined) {
      payload.logo_url = ally.logoUrl;
      payload.image_url = ally.logoUrl;
    }
    if (ally.discountInfo !== undefined) {
      payload.discount_info = ally.discountInfo;
      payload.benefit = ally.discountInfo;
    }

    if (client) {
      try {
        const { data, error } = await client
          .from('allies')
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
