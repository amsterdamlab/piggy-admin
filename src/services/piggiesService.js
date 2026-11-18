/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - PIGGIES SERVICE
   Direct sync with Supabase `piggies` & real cycle telemetry
   ========================================================================== */

import { getClient } from './supabase.js';
import { getPiggyCategoryInfo } from '../utils/piggyCategories.js';

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
          const planVersion = p.plan_version || 'v1_legacy';
          const catInfo = getPiggyCategoryInfo(p.category || 'estandar');
          const cycleDays = Number(p.cycle_days || (planVersion === 'v2_2026' ? catInfo.cycleDays : 144));
          return {
            id: p.id,
            userId: p.user_id,
            userName: owner.full_name || p.full_name || `Participante (${p.user_id ? p.user_id.substring(0, 6) : 'N/A'})`,
            userPhone: owner.whatsapp || 'N/A',
            userEmail: owner.email || 'N/A',
            name: p.name || p.piggy_name || 'Piggy #' + String(p.id).substring(0, 5),
            status: p.status || 'engorde',
            investmentAmount: Number(p.investment_amount || p.price || 1000000),
            extraRoiBonus: Number(p.extra_roi_bonus || p.extra_roi || 0),
            planVersion,
            cycleDays,
            lockedBaseRoi: p.locked_base_roi !== null && p.locked_base_roi !== undefined ? Number(p.locked_base_roi) : null,
            finalReturnAmount: p.final_return_amount !== null && p.final_return_amount !== undefined ? Number(p.final_return_amount) : null,
            currentWeight: Number(p.current_weight || 6.0),
            finalWeight: p.final_weight !== undefined && p.final_weight !== null ? Number(p.final_weight) : (p.target_weight !== undefined && p.target_weight !== null ? Number(p.target_weight) : catInfo.defaultFinalWeight || 85.0),
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
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.category !== undefined) payload.category = updates.category;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.contractCode !== undefined) payload.contract_code = updates.contractCode;
        if (updates.contractUrl !== undefined) payload.contract_url = updates.contractUrl;
        if (updates.currentWeight !== undefined) payload.current_weight = Number(updates.currentWeight);
        if (updates.finalWeight !== undefined) {
          payload.final_weight = updates.finalWeight !== '' && updates.finalWeight !== null ? Number(updates.finalWeight) : null;
        }
        if (updates.extraRoiBonus !== undefined) payload.extra_roi_bonus = Number(updates.extraRoiBonus);
        if (updates.endDate !== undefined) payload.end_date = updates.endDate || null;
        if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
        if (updates.investmentAmount !== undefined) payload.investment_amount = Number(updates.investmentAmount);

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
        const catInfo = getPiggyCategoryInfo(data.category || 'estandar');
        const cycleDays = Number(data.cycleDays || catInfo.cycleDays || 122);
        const daysAdvanced = Number(catInfo.daysAdvanced || 0);
        const daysRemaining = Math.max(1, cycleDays - daysAdvanced);

        const payload = {
          user_id: userId,
          name: data.name || 'Piggy Especial',
          category: data.category || 'estandar',
          plan_version: 'v2_2026',
          cycle_days: cycleDays,
          investment_amount: Number(data.investmentAmount || 1000000),
          extra_roi_bonus: data.extraRoiBonus !== undefined ? Number(data.extraRoiBonus) : Number(catInfo.extraRoiBonus || 0),
          current_weight: Number(data.currentWeight || catInfo.defaultWeight || 6.0),
          final_weight: Number(data.finalWeight || catInfo.defaultFinalWeight || 82.5),
          contract_code: data.contractCode || null,
          status: data.status || 'engorde',
          image_url: data.imageUrl || '',
          purchase_date: new Date().toISOString(),
          end_date: new Date(Date.now() + (daysRemaining * 24 * 3600000)).toISOString()
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
        const { error } = await client.from('piggies').delete().eq('id', piggyId);
        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'No client' };
  }
};
