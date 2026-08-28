/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - MARKETING SERVICE
   Centralized real-time Supabase operations for the 6 marketing & engagement tables:
   1. news_billboard
   2. user_flash_missions
   3. missions
   4. exclusive_piggy_config
   5. cycle_completion_missions
   6. dynamic_tips
   ========================================================================== */

import { getClient } from './supabase.js';

export const marketingService = {
  // ==========================================================================
  // 0. PERFILES DE USUARIOS (profiles)
  // ==========================================================================
  async getProfiles() {
    const client = getClient();
    if (!client) return [];
    try {
      const { data, error } = await client.from('profiles').select('id, full_name, email, phone, whatsapp, created_at');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching profiles in marketingService:', err);
      return [];
    }
  },

  // ==========================================================================
  // ==========================================================================
  // 0.1. CERDITOS EN ENGORDE (piggies)
  // ==========================================================================
  async getPiggies() {
    const client = getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('piggies')
        .select('*')
        .order('end_date', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching piggies in marketingService:', err);
      return [];
    }
  },

  // 1. NOTICIAS Y BANNERS (news_billboard)
  // ==========================================================================
  async getNews() {
    const client = getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('news_billboard')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching news_billboard:', err);
      return [];
    }
  },

  async createNews(item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        image_url: item.image_url || '',
        action_url: item.action_url || '',
        sort_order: Number(item.sort_order || 0),
        is_active: item.is_active !== undefined ? Boolean(item.is_active) : true
      };
      const { data, error } = await client.from('news_billboard').insert([payload]).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async updateNews(id, item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        image_url: item.image_url,
        action_url: item.action_url,
        sort_order: Number(item.sort_order || 0),
        is_active: Boolean(item.is_active)
      };
      const { data, error } = await client.from('news_billboard').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async toggleNewsStatus(id, isActive) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('news_billboard').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async deleteNews(id) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('news_billboard').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ==========================================================================
  // 2. MISIONES FLASH DE USUARIOS (user_flash_missions)
  // ==========================================================================
  async getUserFlashMissions() {
    const client = getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('user_flash_missions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user_flash_missions:', err);
      return [];
    }
  },

  async createUserFlashMission(item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        user_id: item.user_id || null,
        campaign_id: item.campaign_id || null,
        title: item.title || '',
        description: item.description || '',
        piggy_type: item.piggy_type || 'dorado',
        price: Number(item.price || 0),
        scheduled_at: item.scheduled_at || null,
        is_purchased: Boolean(item.is_purchased),
        purchased_at: item.purchased_at || null,
        is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
        mission_title: item.mission_title || 'MISIÓN FLASH',
        icon: item.icon || (item.piggy_type?.startsWith('avanzado') ? '🚀' : '⏳')
      };
      const { data, error } = await client.from('user_flash_missions').insert([payload]).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async updateUserFlashMission(id, item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        title: item.title,
        description: item.description,
        piggy_type: item.piggy_type || 'dorado',
        price: Number(item.price || 0),
        is_active: Boolean(item.is_active)
      };
      if (item.user_id !== undefined) payload.user_id = item.user_id;
      if (item.campaign_id !== undefined) payload.campaign_id = item.campaign_id;
      if (item.scheduled_at !== undefined) payload.scheduled_at = item.scheduled_at;
      if (item.is_purchased !== undefined) payload.is_purchased = item.is_purchased;
      if (item.purchased_at !== undefined) payload.purchased_at = item.purchased_at;
      if (item.mission_title !== undefined) payload.mission_title = item.mission_title;
      if (item.icon !== undefined) payload.icon = item.icon;

      const { data, error } = await client.from('user_flash_missions').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async toggleUserFlashMissionStatus(id, isActive) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('user_flash_missions').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async deleteUserFlashMission(id) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('user_flash_missions').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ==========================================================================
  // 3. CATÁLOGO GENERAL DE MISIONES (missions)
  // ==========================================================================
  async getMissions() {
    const client = getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('missions')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching missions:', err);
      return [];
    }
  },

  async createMission(item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        title: item.title || '',
        icon: item.icon || 'target',
        reward: Number(item.reward || 0),
        sort_order: Number(item.sort_order || 0),
        is_completed: item.is_completed !== undefined ? Boolean(item.is_completed) : false
      };
      if (item.user_id) payload.user_id = item.user_id;

      const { data, error } = await client.from('missions').insert([payload]).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async updateMission(id, item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        title: item.title,
        icon: item.icon,
        reward: Number(item.reward || 0),
        sort_order: Number(item.sort_order || 0),
        is_completed: Boolean(item.is_completed)
      };
      if (item.user_id) payload.user_id = item.user_id;

      const { data, error } = await client.from('missions').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async toggleMissionCompleted(id, isCompleted) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null
      };
      const { error } = await client.from('missions').update(payload).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async deleteMission(id) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('missions').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ==========================================================================
  // 4. CONFIGURACIÓN DE PIGGYS EXCLUSIVOS (exclusive_piggy_config)
  // ==========================================================================
  async getExclusiveConfigs() {
    const client = getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('exclusive_piggy_config')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching exclusive_piggy_config:', err);
      return [];
    }
  },

  async createExclusiveConfig(item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        price: Number(item.price || 0),
        is_enabled: item.is_enabled !== undefined ? Boolean(item.is_enabled) : true,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await client.from('exclusive_piggy_config').insert([payload]).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async updateExclusiveConfig(id, item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        updated_at: new Date().toISOString()
      };
      if (item.piggy_label !== undefined) payload.piggy_label = item.piggy_label;
      if (item.piggy_type !== undefined) payload.piggy_type = item.piggy_type;
      if (item.extra_roi_bonus !== undefined) payload.extra_roi_bonus = Number(item.extra_roi_bonus);
      if (item.price !== undefined) payload.price = Number(item.price);
      if (item.duration_hours !== undefined) payload.duration_hours = Number(item.duration_hours);
      if (item.min_piggies !== undefined) payload.min_piggies = Number(item.min_piggies);
      if (item.is_enabled !== undefined) payload.is_enabled = Boolean(item.is_enabled);
      const { data, error } = await client.from('exclusive_piggy_config').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async toggleExclusiveConfigStatus(id, isEnabled) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('exclusive_piggy_config').update({
        is_enabled: isEnabled,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async deleteExclusiveConfig(id) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('exclusive_piggy_config').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ==========================================================================
  // 5. MISIONES POR CICLO COMPLETO (cycle_completion_missions)
  // ==========================================================================
  async getCycleMissions() {
    const client = getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('cycle_completion_missions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching cycle_completion_missions:', err);
      return [];
    }
  },

  async createCycleMission(item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        user_id: item.user_id || null,
        piggy_id: item.piggy_id || null,
        piggy_type: item.piggy_type || 'plus',
        piggy_label: item.piggy_label || (item.piggy_type ? `Piggy ${item.piggy_type.charAt(0).toUpperCase() + item.piggy_type.slice(1)}` : 'Piggy Plus'),
        extra_roi_bonus: item.extra_roi_bonus !== undefined ? Number(item.extra_roi_bonus) : 0.01,
        price: Number(item.price || 0),
        is_completed: item.is_completed !== undefined ? Boolean(item.is_completed) : false,
        expires_at: item.expires_at ? new Date(item.expires_at).toISOString() : null,
        purchased_at: item.purchased_at || null
      };
      const { data, error } = await client.from('cycle_completion_missions').insert([payload]).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async updateCycleMission(id, item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        price: Number(item.price || 0),
        is_completed: Boolean(item.is_completed),
        expires_at: item.expires_at ? new Date(item.expires_at).toISOString() : null
      };
      if (item.user_id !== undefined) payload.user_id = item.user_id;
      if (item.piggy_id !== undefined) payload.piggy_id = item.piggy_id;
      if (item.piggy_type !== undefined) payload.piggy_type = item.piggy_type;
      if (item.piggy_label !== undefined) payload.piggy_label = item.piggy_label;
      if (item.extra_roi_bonus !== undefined) payload.extra_roi_bonus = Number(item.extra_roi_bonus);
      if (item.purchased_at !== undefined) payload.purchased_at = item.purchased_at;

      const { data, error } = await client.from('cycle_completion_missions').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async toggleCycleMissionCompleted(id, isCompleted) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('cycle_completion_missions').update({ is_completed: isCompleted }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async deleteCycleMission(id) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('cycle_completion_missions').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ==========================================================================
  // 6. TIPS Y CONSEJOS DINÁMICOS (dynamic_tips)
  // ==========================================================================
  async getDynamicTips() {
    const client = getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('dynamic_tips')
        .select('*')
        .order('priority', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching dynamic_tips:', err);
      return [];
    }
  },

  async createDynamicTip(item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        title: item.title || '',
        priority: Number(item.priority || 1),
        icon: item.icon || 'lightbulb',
        cta_url: item.cta_url || '',
        reward: Number(item.reward || 0),
        color: item.color || '#F770B4',
        is_active: item.is_active !== undefined ? Boolean(item.is_active) : true
      };
      const { data, error } = await client.from('dynamic_tips').insert([payload]).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async updateDynamicTip(id, item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        title: item.title,
        priority: Number(item.priority || 1),
        icon: item.icon,
        cta_url: item.cta_url,
        reward: Number(item.reward || 0),
        color: item.color,
        is_active: Boolean(item.is_active)
      };
      const { data, error } = await client.from('dynamic_tips').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async toggleDynamicTipStatus(id, isActive) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('dynamic_tips').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async deleteDynamicTip(id) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('dynamic_tips').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ==========================================================================
  // 7. CAMPAÑAS DE BONOS DE CONSUMO (marketing_bonuses)
  // ==========================================================================
  async getMarketingBonuses() {
    const client = getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('marketing_bonuses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching marketing_bonuses:', err);
      return [];
    }
  },

  async createMarketingBonus(item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        campaign_name: item.campaign_name || 'Nueva Campaña de Bonos',
        description: item.description || '',
        amount: Number(item.amount || 0),
        target_audience: item.target_audience || 'ALL',
        expires_at: item.expires_at || null,
        is_active: item.is_active !== undefined ? Boolean(item.is_active) : true
      };
      const { data, error } = await client.from('marketing_bonuses').insert([payload]).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async updateMarketingBonus(id, item) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        campaign_name: item.campaign_name,
        description: item.description,
        amount: Number(item.amount || 0),
        target_audience: item.target_audience || 'ALL',
        expires_at: item.expires_at || null,
        is_active: Boolean(item.is_active)
      };
      const { data, error } = await client.from('marketing_bonuses').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async toggleMarketingBonusStatus(id, isActive) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const { error } = await client.from('marketing_bonuses').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async deleteMarketingBonus(id) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      // Borrar primero asignaciones dependientes si existen
      try {
        await client.from('user_marketing_bonuses').delete().eq('campaign_id', id);
      } catch (_) {}

      const { error } = await client.from('marketing_bonuses').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ==========================================================================
  // 8. ASIGNACIONES DE BONOS A USUARIOS (user_marketing_bonuses)
  // ==========================================================================
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
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const payload = {
        campaign_id: item.campaign_id || null,
        user_id: item.user_id,
        amount: Number(item.amount || 0),
        status: item.status || 'active',
        granted_at: item.granted_at || new Date().toISOString(),
        expires_at: item.expires_at || null
      };
      const { data, error } = await client.from('user_marketing_bonuses').insert([payload]).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async createUserMarketingBonusesBatch(items) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      const batchSize = 50;
      for (let i = 0; i < items.length; i += batchSize) {
        const slice = items.slice(i, i + batchSize);
        const { error } = await client.from('user_marketing_bonuses').insert(slice);
        if (error) throw error;
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
      const payload = {
        status: item.status,
        expires_at: item.expires_at || null
      };
      if (item.amount !== undefined) payload.amount = Number(item.amount);
      const { data, error } = await client.from('user_marketing_bonuses').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
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

  // ==========================================================================
  // 9. LANZAMIENTO COMPLETO DE CAMPAÑAS CON ASIGNACIÓN INMEDIATA
  // ==========================================================================
  async launchCampaignWithAssignments({ campaign, userIds = [] }) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    try {
      // 1. Crear campaña
      const campRes = await this.createMarketingBonus(campaign);
      if (!campRes.success) return campRes;
      const createdCamp = campRes.data;

      // 2. Si hay usuarios seleccionados, crear asignaciones
      if (userIds.length > 0) {
        const now = new Date().toISOString();
        const assignments = userIds.map(uid => ({
          campaign_id: createdCamp.id,
          user_id: uid,
          amount: Number(createdCamp.amount || 0),
          status: 'active',
          granted_at: now,
          expires_at: createdCamp.expires_at || null
        }));

        await this.createUserMarketingBonusesBatch(assignments);
      }

      return { success: true, data: createdCamp, assignedCount: userIds.length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // ==========================================================================
  // RESUMEN GLOBAL PARA MÉTRICAS
  // ==========================================================================
  async getMarketingOverview() {
    const [news, flashMissions, missions, exclusivePiggies, cycleMissions, tips, bonuses, userBonuses] = await Promise.all([
      this.getNews(),
      this.getUserFlashMissions(),
      this.getMissions(),
      this.getExclusiveConfigs(),
      this.getCycleMissions(),
      this.getDynamicTips(),
      this.getMarketingBonuses(),
      this.getUserMarketingBonuses()
    ]);

    return {
      newsCount: news.length,
      activeNewsCount: news.filter(n => n.is_active).length,
      flashCount: flashMissions.length,
      activeFlashCount: flashMissions.filter(f => f.is_active).length,
      missionsCount: missions.length,
      completedMissionsCount: missions.filter(m => m.is_completed).length,
      exclusiveCount: exclusivePiggies.length,
      activeExclusiveCount: exclusivePiggies.filter(e => e.is_enabled).length,
      cycleCount: cycleMissions.length,
      tipsCount: tips.length,
      activeTipsCount: tips.filter(t => t.is_active).length,
      bonusesCount: bonuses.length,
      activeBonusesCount: bonuses.filter(b => b.is_active).length,
      userBonusesCount: userBonuses.length,
      activeUserBonusesCount: userBonuses.filter(ub => ub.status === 'active').length,
      redeemedUserBonusesCount: userBonuses.filter(ub => ub.status === 'redeemed').length
    };
  }
};
