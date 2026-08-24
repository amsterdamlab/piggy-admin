import { getClient, isUsingMockData } from './supabase.js';

export const gourmetAlliesService = {
  async getGourmetProducts() {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { data, error } = await client
          .from('gourmet_products')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: Number(p.price || 0),
            pointsPrice: Number(p.points_price || 0),
            stock: Number(p.stock || 0),
            imageUrl: p.image_url || '',
            category: p.category || 'Cortes Premium'
          }));
        }
      } catch (e) {}
    }

    return this.getMockGourmetProducts();
  },

  async createGourmetProduct(product) {
    const client = getClient();
    const payload = {
      name: product.name,
      description: product.description || '',
      price: Number(product.price || 0),
      points_price: Number(product.pointsPrice || 0),
      stock: Number(product.stock || 0),
      image_url: product.imageUrl || '',
      category: product.category || 'Cortes Premium'
    };

    if (client && !isUsingMockData()) {
      try {
        const { data, error } = await client
          .from('gourmet_products')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    return { success: true, data: { id: 'gourmet-' + Date.now(), ...payload } };
  },

  async updateGourmetProduct(id, product) {
    const client = getClient();
    const payload = {};
    if (product.name !== undefined) payload.name = product.name;
    if (product.description !== undefined) payload.description = product.description;
    if (product.price !== undefined) payload.price = Number(product.price);
    if (product.pointsPrice !== undefined) payload.points_price = Number(product.pointsPrice);
    if (product.stock !== undefined) payload.stock = Number(product.stock);
    if (product.imageUrl !== undefined) payload.image_url = product.imageUrl;
    if (product.category !== undefined) payload.category = product.category;

    if (client && !isUsingMockData()) {
      try {
        const { data, error } = await client
          .from('gourmet_products')
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

  async deleteGourmetProduct(id) {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { error } = await client.from('gourmet_products').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  async getAllies() {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { data, error } = await client
          .from('allies')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((a) => ({
            id: a.id,
            name: a.name,
            category: a.category || 'Restaurante',
            location: a.location || 'Cali, Colombia',
            logoUrl: a.logo_url || '',
            discountInfo: a.discount_info || '10% OFF con Piggy Pass'
          }));
        }
      } catch (e) {}
    }

    return this.getMockAllies();
  },

  async createAlly(ally) {
    const client = getClient();
    const payload = {
      name: ally.name,
      category: ally.category || 'Restaurante',
      location: ally.location || 'Cali',
      logo_url: ally.logoUrl || '',
      discount_info: ally.discountInfo || '10% de descuento'
    };

    if (client && !isUsingMockData()) {
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

    return { success: true, data: { id: 'ally-' + Date.now(), ...payload } };
  },

  async updateAlly(id, ally) {
    const client = getClient();
    const payload = {};
    if (ally.name !== undefined) payload.name = ally.name;
    if (ally.category !== undefined) payload.category = ally.category;
    if (ally.location !== undefined) payload.location = ally.location;
    if (ally.logoUrl !== undefined) payload.logo_url = ally.logoUrl;
    if (ally.discountInfo !== undefined) payload.discount_info = ally.discountInfo;

    if (client && !isUsingMockData()) {
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

    return { success: true };
  },

  async deleteAlly(id) {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { error } = await client.from('allies').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  getMockGourmetProducts() {
    return [
      {
        id: 'gourmet-1',
        name: 'Combo Parrillero Piggy Prime (5kg)',
        description: 'Incluye Costilla San Luis, Bondiola marinada, Solomillo y Chorizos artesanales.',
        price: 185000,
        pointsPrice: 500,
        stock: 18,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
        category: 'Combos Especiales'
      },
      {
        id: 'gourmet-2',
        name: 'Costillar Ahumado al Vacío (2.5kg)',
        description: 'Costillar ahumado con madera de nogal, listo para dorar a la parrilla.',
        price: 98000,
        pointsPrice: 280,
        stock: 24,
        imageUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
        category: 'Cortes Premium'
      }
    ];
  },

  getMockAllies() {
    return [
      {
        id: 'ally-1',
        name: 'Restaurante Fogón & Cava',
        category: 'Restaurante Gourmet',
        location: 'Granada, Cali',
        logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        discountInfo: '15% OFF en toda la carta de cortes de cerdo'
      },
      {
        id: 'ally-2',
        name: 'Carnicería Boutique La Porcina',
        category: 'Punto de Distribución',
        location: 'Pance, Cali',
        logoUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400',
        discountInfo: 'Canje de tokens directo sin costo de domicilio'
      }
    ];
  }
};
