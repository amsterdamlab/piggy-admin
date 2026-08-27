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

  // ==========================================================================
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
        is_active: item.is_active !== undefined ? Boolean(item.is_active) : true
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
        reward: item.reward || '',
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
        reward: item.reward,
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
        .order('price', { ascending: true });
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
        is_enabled: item.is_enabled !== undefined ? Boolean(item.is_enabled) : true
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
        price: Number(item.price || 0),
        is_enabled: Boolean(item.is_enabled),
        updated_at: new Date().toISOString()
      };
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
      const { error } = await client.from('exclusive_piggy_config').update({ is_enabled: isEnabled, updated_at: new Date().toISOString() }).eq('id', id);
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
        price: Number(item.price || 0),
        piggy_type: item.piggy_type || 'plus',
        is_completed: item.is_completed !== undefined ? Boolean(item.is_completed) : false
      };
      if (item.user_id) payload.user_id = item.user_id;
      if (item.piggy_id) payload.piggy_id = item.piggy_id;
      if (item.expires_at) payload.expires_at = item.expires_at;
      if (item.purchased_at) payload.purchased_at = item.purchased_at;

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
        is_completed: Boolean(item.is_completed)
      };
      if (item.user_id !== undefined) payload.user_id = item.user_id;
      if (item.piggy_id !== undefined) payload.piggy_id = item.piggy_id;
      if (item.piggy_type !== undefined) payload.piggy_type = item.piggy_type;
      if (item.expires_at !== undefined) payload.expires_at = item.expires_at;
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
  // 6. CONSEJOS Y TIPS DINÁMICOS (dynamic_tips)
  // ==========================================================================
  async getDynamicTips() {
    const client = getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from('dynamic_tips')
        .select('*')
        .order('priority', { ascending: true });
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
        reward: Number(item.reward || 0),
        icon: item.icon || 'lightbulb',
        color: item.color || '#F770B4',
        cta_url: item.cta_url || '',
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
        reward: Number(item.reward || 0),
        icon: item.icon,
        color: item.color,
        cta_url: item.cta_url,
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
  // 7. CONSOLIDADO DE MÉTRICAS GLOBALES DE MARKETING
  // ==========================================================================
  async getMarketingOverview() {
    const [news, flash, missions, cycles, exclusive, tips] = await Promise.all([
      this.getNews(),
      this.getUserFlashMissions(),
      this.getMissions(),
      this.getCycleMissions(),
      this.getExclusiveConfigs(),
      this.getDynamicTips()
    ]);

    return {
      newsCount: news.length,
      activeNewsCount: news.filter(n => n.is_active).length,
      flashMissionsCount: flash.length,
      activeFlashCount: flash.filter(f => f.is_active).length,
      missionsCount: missions.length,
      cycleMissionsCount: cycles.length,
      activeExclusiveCount: exclusive.filter(e => e.is_enabled).length,
      tipsCount: tips.length,
      activeTipsCount: tips.filter(t => t.is_active).length
    };
  }
};
