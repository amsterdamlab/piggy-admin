import { getClient, isUsingMockData } from './supabase.js';

export const piggiesService = {
  async getPiggies(statusFilter = 'all') {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        let query = client
          .from('piggies')
          .select('*, profiles(id, full_name, whatsapp, email)')
          .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((p) => ({
            id: p.id,
            userId: p.user_id,
            userName: p.profiles?.full_name || 'Usuario desconocido',
            userPhone: p.profiles?.whatsapp || 'N/A',
            userEmail: p.profiles?.email || 'N/A',
            name: p.name || 'Piggy #' + p.id.substring(0, 5),
            status: p.status || 'engorde',
            investmentAmount: Number(p.investment_amount || 1000000),
            extraRoiBonus: Number(p.extra_roi_bonus || 0),
            currentWeight: Number(p.current_weight || 15.0),
            purchaseDate: p.purchase_date || p.created_at,
            endDate: p.end_date,
            imageUrl: p.image_url || ''
          }));
        }
      } catch (e) {}
    }

    const mock = this.getMockPiggies();
    if (statusFilter === 'all') return mock;
    return mock.filter((p) => p.status === statusFilter);
  },

  async updatePiggy(piggyId, updates) {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const payload = {};
        if (updates.currentWeight !== undefined) payload.current_weight = Number(updates.currentWeight);
        if (updates.extraRoiBonus !== undefined) payload.extra_roi_bonus = Number(updates.extraRoiBonus);
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.endDate !== undefined) payload.end_date = updates.endDate;
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;

        const { error } = await client
          .from('piggies')
          .update(payload)
          .eq('id', piggyId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  async createPiggyForUser(userId, data) {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const payload = {
          user_id: userId,
          name: data.name || 'Piggy Especial',
          investment_amount: Number(data.investmentAmount || 1000000),
          extra_roi_bonus: Number(data.extraRoiBonus || 0),
          current_weight: Number(data.currentWeight || 15.0),
          status: data.status || 'engorde',
          image_url: data.imageUrl || ''
        };

        const { data: created, error } = await client
          .from('piggies')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data: created };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  async deletePiggy(piggyId) {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { error } = await client.from('piggies').delete().eq('id', piggyId);
        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  getMockPiggies() {
    return [
      {
        id: 'pig-101',
        userId: 'usr-001',
        userName: 'Carlos Mario Restrepo',
        userPhone: '+57 312 456 7890',
        userEmail: 'carlos.restrepo@gmail.com',
        name: 'Piggy Titan #1',
        status: 'engorde',
        investmentAmount: 1000000,
        extraRoiBonus: 0.02,
        currentWeight: 78.5,
        purchaseDate: '2026-04-10T10:00:00Z',
        endDate: '2026-09-01T10:00:00Z',
        imageUrl: ''
      },
      {
        id: 'pig-102',
        userId: 'usr-001',
        userName: 'Carlos Mario Restrepo',
        userPhone: '+57 312 456 7890',
        userEmail: 'carlos.restrepo@gmail.com',
        name: 'Piggy Landrace #2',
        status: 'engorde',
        investmentAmount: 1000000,
        extraRoiBonus: 0.01,
        currentWeight: 65.2,
        purchaseDate: '2026-05-15T12:30:00Z',
        endDate: '2026-10-06T12:30:00Z',
        imageUrl: ''
      },
      {
        id: 'pig-103',
        userId: 'usr-002',
        userName: 'Valentina Gómez Cárdenas',
        userPhone: '+57 300 987 6543',
        userEmail: 'valen.gomez@hotmail.com',
        name: 'Piggy Pietrain #1',
        status: 'engorde',
        investmentAmount: 1000000,
        extraRoiBonus: 0.02,
        currentWeight: 84.0,
        purchaseDate: '2026-03-20T08:00:00Z',
        endDate: '2026-08-11T08:00:00Z',
        imageUrl: ''
      },
      {
        id: 'pig-104',
        userId: 'usr-003',
        userName: 'Andrés Felipe Morales',
        userPhone: '+57 315 333 2211',
        userEmail: 'af.morales@outlook.com',
        name: 'Piggy Duroc Clásico',
        status: 'completado',
        investmentAmount: 1000000,
        extraRoiBonus: 0,
        currentWeight: 105.0,
        purchaseDate: '2026-02-01T10:00:00Z',
        endDate: '2026-06-25T10:00:00Z',
        imageUrl: ''
      },
      {
        id: 'pig-105',
        userId: 'usr-004',
        userName: 'Diana Marcela Lozano',
        userPhone: '+57 318 777 8899',
        userEmail: 'diana.lozano@gmail.com',
        name: 'Piggy Yorkshire #4',
        status: 'liquidado',
        investmentAmount: 1000000,
        extraRoiBonus: 0.01,
        currentWeight: 110.0,
        purchaseDate: '2026-01-10T14:00:00Z',
        endDate: '2026-06-03T14:00:00Z',
        imageUrl: ''
      }
    ];
  }
};
