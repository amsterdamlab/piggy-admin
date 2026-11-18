/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - MARKETING BONUSES SERVICE
   Sincronización 100% integral con `profiles.consumption_balance`,
   `wallet_transactions` (Auditoría) y `wallet_requests`
   ========================================================================== */

import { getClient } from './supabase.js';

export const marketingBonusesService = {
  async getUserMarketingBonuses() {
    const client = getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('user_marketing_bonuses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user_marketing_bonuses:', err);
      return [];
    }
  },

  async createUserMarketingBonus(item) {
    return await this.createUserMarketingBonusesBatch([item]);
  },

  async createUserMarketingBonusesBatch(items) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const now = new Date().toISOString();

      // 1. Insertar filas en user_marketing_bonuses
      const batchSize = 50;
      for (let i = 0; i < items.length; i += batchSize) {
        const slice = items.slice(i, i + batchSize).map(item => ({
          user_id: item.user_id,
          campaign_name: item.campaign_name || 'Bono de Consumo',
          amount: Number(item.amount || 0),
          status: item.status || 'active',
          is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
          expires_at: item.expires_at || null,
          created_at: now
        }));
        const { error } = await client.from('user_marketing_bonuses').insert(slice);
        if (error) throw error;
      }

      // 2. Registrar transacciones contables y solicitudes (Auditoría Financiera)
      for (const item of items) {
        const uid = item.user_id;
        const amount = Number(item.amount || 0);
        if (!uid || amount <= 0) continue;

        try {
          const { data: profile } = await client
            .from('profiles')
            .select('id, full_name')
            .eq('id', uid)
            .single();

          const userName = profile?.full_name || 'Participante';
          const bnoRef = `BNO-${Math.floor(100000 + Math.random() * 900000)}`;

          // A. Registrar en wallet_transactions (El trigger de PostgreSQL actualiza profiles.consumption_balance)
          await client.from('wallet_transactions').insert({
            user_id: uid,
            amount: amount,
            type: 'credit',
            description: `Bono de Consumo: ${item.campaign_name || 'Marketing'} [Ref: ${bnoRef}]`,
            wallet_type: 'consumo',
            payment_method: 'MARKETING_BONUS',
            simulation_status: 'APPROVED',
            created_at: now
          });

          // B. Registrar en wallet_requests (Solicitud aprobada de bono)
          await client.from('wallet_requests').insert({
            user_id: uid,
            user_name: userName,
            request_type: 'recharge',
            amount: amount,
            payment_method: 'MARKETING_BONUS',
            reference: bnoRef,
            wallet_type: 'consumo',
            notes: `Bono de Consumo: ${item.campaign_name || 'Marketing'}`,
            status: 'approved',
            created_at: now,
            processed_at: now,
            processed_by: 'admin'
          });

          // C. Si el estado inicial es 'redeemed', registrar además el débito de canje en tienda
          if (item.status === 'redeemed') {
            const canjeRef = `CRN-${Math.floor(100000 + Math.random() * 900000)}`;
            
            await client.from('wallet_transactions').insert({
              user_id: uid,
              amount: -amount,
              type: 'debit',
              description: `Canje de Bono en Tienda: ${item.campaign_name || 'Marketing'} [Ref: ${canjeRef}]`,
              wallet_type: 'consumo',
              payment_method: 'CANJE_TIENDA',
              simulation_status: 'APPROVED',
              created_at: now
            });

            await client.from('wallet_requests').insert({
              user_id: uid,
              user_name: userName,
              request_type: 'bonus_debit',
              amount: amount,
              payment_method: 'CANJE_TIENDA',
              reference: canjeRef,
              wallet_type: 'consumo',
              notes: `Canje Inmediato de Bono en Tienda: ${item.campaign_name || 'Marketing'}`,
              status: 'approved',
              created_at: now,
              processed_at: now,
              processed_by: 'admin'
            });
          }
        } catch (subErr) {
          console.warn('Advertencia registrando transacción financiera para usuario:', uid, subErr);
        }
      }

      return { success: true, count: items.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async updateUserMarketingBonus(id, item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const now = new Date().toISOString();

      // Si se está cambiando el estado a 'redeemed' (canjeado en tienda)
      if (item.status === 'redeemed') {
        const { data: bonusRecord } = await client.from('user_marketing_bonuses').select('*').eq('id', id).single();
        if (bonusRecord && bonusRecord.status !== 'redeemed') {
          const uid = bonusRecord.user_id;
          const amount = Number(bonusRecord.amount || 0);

          if (uid && amount > 0) {
            const { data: profile } = await client.from('profiles').select('full_name').eq('id', uid).single();
            const canjeRef = `CRN-${Math.floor(100000 + Math.random() * 900000)}`;

            // A. Registrar débito en wallet_transactions (El trigger de PostgreSQL debita profiles.consumption_balance)
            await client.from('wallet_transactions').insert({
              user_id: uid,
              amount: -amount,
              type: 'debit',
              description: `Canje de Bono en Tienda: ${bonusRecord.campaign_name || 'Bono Consumo'} [Ref: ${canjeRef}]`,
              wallet_type: 'consumo',
              payment_method: 'CANJE_TIENDA',
              simulation_status: 'APPROVED',
              created_at: now
            });

            // B. Registrar débito en wallet_requests
            await client.from('wallet_requests').insert({
              user_id: uid,
              user_name: profile?.full_name || 'Participante',
              request_type: 'bonus_debit',
              amount: amount,
              payment_method: 'CANJE_TIENDA',
              reference: canjeRef,
              wallet_type: 'consumo',
              notes: `Canje de Bono en Tienda: ${bonusRecord.campaign_name || 'Bono Consumo'}`,
              status: 'approved',
              created_at: now,
              processed_at: now,
              processed_by: 'admin'
            });
          }
        }
      }

      const payload = {};
      if (item.campaign_name !== undefined) payload.campaign_name = item.campaign_name;
      if (item.amount !== undefined) payload.amount = Number(item.amount);
      if (item.status !== undefined) payload.status = item.status;
      if (item.is_active !== undefined) payload.is_active = Boolean(item.is_active);
      if (item.expires_at !== undefined) payload.expires_at = item.expires_at || null;

      const { data, error } = await client.from('user_marketing_bonuses').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async toggleUserMarketingBonusStatus(id, isActive) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('user_marketing_bonuses').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async deleteUserMarketingBonus(id) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('user_marketing_bonuses').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async toggleCampaignBatchStatus(campaignName, isActive) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('user_marketing_bonuses').update({ is_active: isActive }).eq('campaign_name', campaignName);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async deleteCampaignBatch(campaignName) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('user_marketing_bonuses').delete().eq('campaign_name', campaignName);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async launchCampaign({ campaign_name, amount, expires_at = null, is_active = true, userIds = [] }) {
    if (!userIds || userIds.length === 0) {
      return { success: false, error: 'No se seleccionaron usuarios para asignar la campaña' };
    }

    const items = userIds.map(uid => ({
      user_id: uid,
      campaign_name: campaign_name || 'Campaña de Bonos',
      amount: Number(amount || 0),
      status: 'active',
      is_active: Boolean(is_active),
      expires_at: expires_at || null
    }));

    return await this.createUserMarketingBonusesBatch(items);
  }
};
