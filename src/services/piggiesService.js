/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - PIGGIES SERVICE
   Direct sync with Supabase `piggies` & real cycle telemetry
   ========================================================================== */

import { getClient } from './supabase.js';

export const piggiesService = {
  async getPiggies(statusFilter = 'all') {
    const client = getClient();
    if (!client) return [];

    try {
      const [pigRes, profRes] = await Promise.all([
        client.from('piggies').select('*').order('created_at', { ascending: false }),
        client.from('profiles').select('id, full_name, whatsapp, email')
      ]);

      const piggies = pigRes.data || [];
      const profiles = profRes.data || [];
      const profileMap = {};
      profiles.forEach((p) => {
        profileMap[p.id] = p;
      });

      if (piggies.length > 0) {
        let mapped = piggies.map((p) => {
          const owner = profileMap[p.user_id] || {};
          return {
            id: p.id,
            userId: p.user_id,
            userName: owner.full_name || p.full_name || `Inversionista (${p.user_id ? p.user_id.substring(0, 6) : 'N/A'})`,
            userPhone: owner.whatsapp || 'N/A',
            userEmail: owner.email || 'N/A',
            name: p.name || p.piggy_name || 'Piggy #' + String(p.id).substring(0, 5),
            status: p.status || 'engorde',
            investmentAmount: Number(p.investment_amount || p.price || 1000000),
            extraRoiBonus: Number(p.extra_roi_bonus || p.extra_roi || 0),
            currentWeight: Number(p.current_weight || 15.0),
            purchaseDate: p.purchase_date || p.created_at,
            endDate: p.end_date,
            contractCode: p.contract_code || '',
            contractUrl: p.contract_url || '',
            category: p.category || 'estandar',
            imageUrl: p.image_url || ''
          };
        });

        if (statusFilter !== 'all') {
          mapped = mapped.filter((p) => p.status === statusFilter);
        }

        return mapped;
      }
    } catch (e) {
      console.error('Piggies query exception:', e);
    }

    return [];
  },

  async updatePiggy(piggyId, updates) {
    const client = getClient();
    if (client) {
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
    return { success: false, error: 'No client' };
  },

  async createPiggyForUser(userId, data) {
    const client = getClient();
    if (client) {
      try {
        const payload = {
          user_id: userId,
          name: data.name || 'Piggy Especial',
          investment_amount: Number(data.investmentAmount || 1000000),
          extra_roi_bonus: Number(data.extraRoiBonus || 0),
          current_weight: Number(data.currentWeight || 15.0),
          status: data.status || 'engorde',
          image_url: data.imageUrl || '',
          purchase_date: new Date().toISOString(),
          end_date: new Date(Date.now() + (144 * 24 * 3600000)).toISOString()
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
    return { success: false, error: 'No client' };
  },

  async deletePiggy(piggyId) {
    const client = getClient();
    if (client) {
      try {
        const { error } = await client
          .from('piggies')
          .delete().eq('id', piggyId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'No client' };
  }
};
