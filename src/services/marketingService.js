/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - MARKETING SERVICE
   Centralized real-time Supabase operations for marketing & engagement tables:
   1. news_billboard
   2. user_flash_missions
   3. missions
   4. exclusive_piggy_config
   5. cycle_completion_missions
   6. dynamic_tips
   7. user_marketing_bonuses (Bonos de Consumo & Campañas)
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
      const { data, error } = await client.from('profiles').select('id, full_name, email, phone, whatsapp, consumption_balance, wallet_balance, created_at');
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
        mission_title: item.mission_title || 'MISIÓN FLASH',
        title: item.title || '',
        description: item.description || '',
        icon: item.icon || '⚡',
        piggy_type: item.piggy_type || 'dorado',
        piggy_label: item.piggy_label || null,
        benefit_title: item.benefit_title || null,
        benefit_description: item.benefit_description || null,
        badge: item.badge || null,
        price: Number(item.price || 0),
        scheduled_at: item.scheduled_at || null,
        is_purchased: Boolean(item.is_purchased),
        purchased_at: item.purchased_at || null,
        is_active: item.is_active !== undefined ? Boolean(item.is_active) : true
      };
      if (item.expires_at !== undefined) payload.expires_at = item.expires_at || null;

      try {
        const { data, error } = await client.from('user_flash_missions').insert([payload]).select().single();
        if (error) throw error;
        return { success: true, data };
      } catch (insertErr) {
        // Si la columna expires_at aún no ha sido agregada en la BD, reintentar sin ella
        if ((insertErr?.code === '42703' || insertErr?.code === 'PGRST204' || insertErr?.message?.includes('expires_at')) && payload.expires_at !== undefined) {
          delete payload.expires_at;
          const { data, error } = await client.from('user_flash_missions').insert([payload]).select().single();
          if (error) throw error;
          return { success: true, data };
        }
        throw insertErr;
      }
    } catch (err) {
      console.error('Error creating user flash mission:', err);
      return { success: false, error: err.message || 'Error al guardar en base de datos' };
    }
  },

  async createUserFlashMissionsBatch(items) {
    const client = getClient();
    if (!client) return { success: false, error: 'Sin conexión a base de datos' };
    if (!items || items.length === 0) return { success: true, count: 0 };
    try {
      const batchSize = 50;
      let insertedTotal = 0;
      for (let i = 0; i < items.length; i += batchSize) {
        const slice = items.slice(i, i + batchSize).map(item => {
          const row = {
            user_id: item.user_id || null,
            campaign_id: item.campaign_id || null,
            mission_title: item.mission_title || 'MISIÓN FLASH',
            title: item.title || '',
            description: item.description || '',
            icon: item.icon || '⚡',
            piggy_type: item.piggy_type || 'dorado',
            piggy_label: item.piggy_label || null,
            benefit_title: item.benefit_title || null,
            benefit_description: item.benefit_description || null,
            badge: item.badge || null,
            price: Number(item.price || 0),
            scheduled_at: item.scheduled_at || null,
            is_purchased: Boolean(item.is_purchased),
            purchased_at: item.purchased_at || null,
            is_active: item.is_active !== undefined ? Boolean(item.is_active) : true
          };
          if (item.expires_at !== undefined) row.expires_at = item.expires_at || null;
          return row;
        });

        try {
          const { error } = await client.from('user_flash_missions').insert(slice);
          if (error) throw error;
          insertedTotal += slice.length;
        } catch (batchErr) {
          if (batchErr?.code === '42703' || batchErr?.code === 'PGRST204' || batchErr?.message?.includes('expires_at')) {
            slice.forEach(r => delete r.expires_at);
            const { error } = await client.from('user_flash_missions').insert(slice);
            if (error) throw error;
            insertedTotal += slice.length;
          } else {
            throw batchErr;
          }
        }
      }
      return { success: true, count: insertedTotal };
    } catch (err) {
      console.error('Error in batch insert user flash missions:', err);
      return { success: false, error: err.message || 'Error al guardar lote en base de datos' };
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
      if (item.expires_at !== undefined) payload.expires_at = item.expires_at;
      if (item.is_purchased !== undefined) payload.is_purchased = item.is_purchased;
      if (item.purchased_at !== undefined) payload.purchased_at = item.purchased_at;
      if (item.mission_title !== undefined) payload.mission_title = item.mission_title;
      if (item.icon !== undefined) payload.icon = item.icon;
      if (item.piggy_label !== undefined) payload.piggy_label = item.piggy_label;
      if (item.benefit_title !== undefined) payload.benefit_title = item.benefit_title;
      if (item.benefit_description !== undefined) payload.benefit_description = item.benefit_description;
      if (item.badge !== undefined) payload.badge = item.badge;

      try {
        const { data, error } = await client.from('user_flash_missions').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return { success: true, data };
      } catch (updateErr) {
        if ((updateErr?.code === '42703' || updateErr?.code === 'PGRST204' || updateErr?.message?.includes('expires_at')) && payload.expires_at !== undefined) {
          delete payload.expires_at;
          const { data, error } = await client.from('user_flash_missions').update(payload).eq('id', id).select().single();
          if (error) throw error;
          return { success: true, data };
        }
        throw updateErr;
      }
    } catch (err) {
      console.error('Error updating user flash mission:', err);
      return { success: false, error: err.message || 'Error al actualizar en base de datos' };
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
  // 7. BONOS DE CONSUMO & CAMPAÑAS (user_marketing_bonuses)
  // Sincronización 100% integral con `profiles.consumption_balance`,
  // `wallet_transactions` (Auditoría) y `wallet_requests`
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

          const userName = profile?.full_name || 'Inversionista';
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
              user_name: profile?.full_name || 'Inversionista',
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
  },

  // ==========================================================================
  // RESUMEN GLOBAL PARA MÉTRICAS
  // ==========================================================================
  async getMarketingOverview() {
    const [news, flashMissions, missions, exclusivePiggies, cycleMissions, tips, userBonuses] = await Promise.all([
      this.getNews(),
      this.getUserFlashMissions(),
      this.getMissions(),
      this.getExclusiveConfigs(),
      this.getCycleMissions(),
      this.getDynamicTips(),
      this.getUserMarketingBonuses()
    ]);

    const now = new Date();
    const uniqueCampaigns = new Set(userBonuses.map(ub => ub.campaign_name).filter(Boolean));
    const activeBonuses = userBonuses.filter(ub => ub.is_active && ub.status === 'active' && (!ub.expires_at || new Date(ub.expires_at) >= now));
    const redeemedBonuses = userBonuses.filter(ub => ub.status === 'redeemed');

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
      campaignsCount: uniqueCampaigns.size,
      userBonusesCount: userBonuses.length,
      activeUserBonusesCount: activeBonuses.length,
      redeemedUserBonusesCount: redeemedBonuses.length
    };
  }
};
