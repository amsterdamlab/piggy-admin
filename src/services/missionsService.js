import { getClient, isUsingMockData } from './supabase.js';

export const missionsService = {
  async getCampaigns() {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { data, error } = await client
          .from('flash_mission_campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((m) => ({
            id: m.id,
            title: m.title || m.mission_name || 'Misión Flash',
            description: m.description || '',
            rewardPoints: Number(m.reward_points || m.points || 0),
            rewardBonusRoi: Number(m.reward_bonus_roi || 0),
            startDate: m.start_date || m.created_at,
            endDate: m.end_date || null,
            isActive: m.is_active !== undefined ? m.is_active : true,
            targetAction: m.target_action || 'check_in'
          }));
        }
      } catch (e) {}
    }

    return this.getMockCampaigns();
  },

  async createCampaign(campaign) {
    const client = getClient();
    const payload = {
      title: campaign.title,
      description: campaign.description || '',
      reward_points: Number(campaign.rewardPoints || 0),
      reward_bonus_roi: Number(campaign.rewardBonusRoi || 0),
      start_date: campaign.startDate || new Date().toISOString(),
      end_date: campaign.endDate || null,
      is_active: campaign.isActive !== undefined ? campaign.isActive : true,
      target_action: campaign.targetAction || 'check_in'
    };

    if (client && !isUsingMockData()) {
      try {
        const { data, error } = await client
          .from('flash_mission_campaigns')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    return { success: true, data: { id: 'fm-' + Date.now(), ...payload } };
  },

  async toggleCampaignStatus(id, isActive) {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { error } = await client
          .from('flash_mission_campaigns')
          .update({ is_active: isActive })
          .eq('id', id);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  async deleteCampaign(id) {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { error } = await client
          .from('flash_mission_campaigns')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  getMockCampaigns() {
    return [
      {
        id: 'fm-1',
        title: '⚡ Flash: Alimenta a tu Piggy este Fin de Semana',
        description: 'Ingresa a la app y completa el check-in diario para ganar 50 puntos Piggy.',
        rewardPoints: 50,
        rewardBonusRoi: 0,
        startDate: '2026-08-22T00:00:00Z',
        endDate: '2026-08-25T23:59:59Z',
        isActive: true,
        targetAction: 'check_in'
      },
      {
        id: 'fm-2',
        title: '🔥 Super Engorde: Bono +0.5% ROI Adicional',
        description: 'Adquiere 2 o más cerditos antes de finalizar el mes y recibe un bono vitalicio extra.',
        rewardPoints: 200,
        rewardBonusRoi: 0.005,
        startDate: '2026-08-01T00:00:00Z',
        endDate: '2026-08-31T23:59:59Z',
        isActive: true,
        targetAction: 'purchase'
      }
    ];
  }
};
