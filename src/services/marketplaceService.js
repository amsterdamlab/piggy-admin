import { getClient, isUsingMockData } from './supabase.js';

export const marketplaceService = {
  async getItems() {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { data, error } = await client
          .from('marketplace')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((item) => ({
            id: item.id,
            itemName: item.item_name || item.name || 'Piggy Especial',
            description: item.description || '',
            price: Number(item.price || 1000000),
            extraRoi: Number(item.extra_roi || 0),
            stock: Number(item.stock || 0),
            imageUrl: item.image_url || '',
            badge: item.badge || (item.extra_roi > 0 ? `+${(item.extra_roi * 100).toFixed(0)}% ROI` : 'Estándar'),
            category: item.category || 'Acelerador'
          }));
        }
      } catch (e) {}
    }

    return this.getMockItems();
  },

  async createItem(item) {
    const client = getClient();
    const payload = {
      item_name: item.itemName,
      description: item.description || '',
      price: Number(item.price || 1000000),
      extra_roi: Number(item.extraRoi || 0),
      stock: Number(item.stock || 10),
      image_url: item.imageUrl || '',
      badge: item.badge || (item.extraRoi > 0 ? `+${(Number(item.extraRoi) * 100).toFixed(0)}% ROI` : 'Estándar'),
      category: item.category || 'Acelerador'
    };

    if (client && !isUsingMockData()) {
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

    return { success: true, data: { id: 'mk-' + Date.now(), ...payload } };
  },

  async updateItem(id, item) {
    const client = getClient();
    const payload = {};
    if (item.itemName !== undefined) payload.item_name = item.itemName;
    if (item.description !== undefined) payload.description = item.description;
    if (item.price !== undefined) payload.price = Number(item.price);
    if (item.extraRoi !== undefined) {
      payload.extra_roi = Number(item.extraRoi);
      payload.badge = payload.extra_roi > 0 ? `+${(payload.extra_roi * 100).toFixed(0)}% ROI` : 'Estándar';
    }
    if (item.stock !== undefined) payload.stock = Number(item.stock);
    if (item.imageUrl !== undefined) payload.image_url = item.imageUrl;
    if (item.category !== undefined) payload.category = item.category;

    if (client && !isUsingMockData()) {
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

    return { success: true };
  },

  async deleteItem(id) {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { error } = await client.from('marketplace').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  getMockItems() {
    return [
      {
        id: 'mk-001',
        itemName: 'Piggy Titan +2% ROI',
        description: 'Lote premium con suplementación vitamínica y aceleración de engorde asegurada.',
        price: 1000000,
        extraRoi: 0.02,
        stock: 5,
        imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400',
        badge: '+2% ROI Extra',
        category: 'Acelerador Gold'
      },
      {
        id: 'mk-002',
        itemName: 'Piggy Pietrain +1% ROI',
        description: 'Genética de alto rendimiento magro y excelente velocidad de conversión alimenticia.',
        price: 1000000,
        extraRoi: 0.01,
        stock: 12,
        imageUrl: 'https://images.unsplash.com/photo-1541689592655-f5f52825a3b8?w=400',
        badge: '+1% ROI Extra',
        category: 'Acelerador Silver'
      },
      {
        id: 'mk-003',
        itemName: 'Piggy Landrace Estándar',
        description: 'Cerdo tradicional de raza pura con ciclo base de engorde de 19 semanas.',
        price: 1000000,
        extraRoi: 0,
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=400',
        badge: 'Base Estándar',
        category: 'Estándar'
      }
    ];
  }
};
