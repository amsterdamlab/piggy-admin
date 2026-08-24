/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - PIGGIES SERVICE
   Direct sync with Supabase `piggies` & real cycle telemetry
   ========================================================================== */

import { getClient } from './supabase.js';

export const piggiesService = {
  async getPiggies(statusFilter = 'all') {
    const client = getClient();
    if (client) {
      try {
        let query = client
          .from('piggies')
          .select('*')
          .order('created_at', { ascending: false });

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((p) => ({
            id: p.id,
            userId: p.user_id,
            userName: `Inversionista (${p.user_id ? p.user_id.substring(0, 6) : 'N/A'})`,
            userPhone: 'Registrado',
            userEmail: 'Registrado',
            name: p.name || p.piggy_name || 'Piggy #' + String(p.id).substring(0, 5),
            status: p.status || 'engorde',
            investmentAmount: Number(p.investment_amount || p.price || 1000000),
            extraRoiBonus: Number(p.extra_roi_bonus || p.extra_roi || 0),
            currentWeight: Number(p.current_weight || 15.0),
            purchaseDate: p.purchase_date || p.created_at,
            endDate: p.end_date,
            imageUrl: p.image_url || ''
          }));
        }
      } catch (e) {
        console.warn('Piggies query error:', e);
      }

      // If piggies table returns 0 due to RLS, extract real piggies from transactions telemetry
      try {
        const { data: txs } = await client
          .from('wallet_transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (txs && txs.length > 0) {
          const piggiesList = [];
          const seenPiggies = new Set();

          txs.forEach((t) => {
            const desc = t.description || '';
            const matchCiclo = desc.match(/(?:Liquidación por ciclo completado|Ciclo completado):\s*([^\—\(\n]+)/i);
            const matchCompra = desc.match(/(?:compra de Piggy|Compra Piggy)\s*([^\—\(\n]*)/i);

            if (matchCiclo) {
              const name = matchCiclo[1].trim();
              const uniqueKey = `${t.user_id}_${name}`;
              if (!seenPiggies.has(uniqueKey)) {
                seenPiggies.add(uniqueKey);
                piggiesList.push({
                  id: `piggy-${t.id.substring(0, 8)}`,
                  userId: t.user_id,
                  userName: `Usuario ${t.user_id ? t.user_id.substring(0, 8) : ''}`,
                  userPhone: 'En Billetera',
                  userEmail: 'En Billetera',
                  name: name || 'Piggy de Granja',
                  status: 'completado',
                  investmentAmount: 1000000,
                  extraRoiBonus: desc.includes('ROI: 12') ? 0.02 : (desc.includes('ROI: 10') ? 0.01 : 0),
                  currentWeight: 105.0,
                  purchaseDate: t.created_at,
                  endDate: t.created_at,
                  imageUrl: ''
                });
              }
            } else if (matchCompra && t.amount < 0) {
              const name = matchCompra[1].trim() || 'Piggy en Engorde';
              const uniqueKey = `${t.user_id}_${t.created_at}`;
              if (!seenPiggies.has(uniqueKey)) {
                seenPiggies.add(uniqueKey);
                piggiesList.push({
                  id: `piggy-${t.id.substring(0, 8)}`,
                  userId: t.user_id,
                  userName: `Usuario ${t.user_id ? t.user_id.substring(0, 8) : ''}`,
                  userPhone: 'En Billetera',
                  userEmail: 'En Billetera',
                  name: name,
                  status: 'engorde',
                  investmentAmount: Math.abs(Number(t.amount || 1000000)),
                  extraRoiBonus: 0.01,
                  currentWeight: 55.0,
                  purchaseDate: t.created_at,
                  endDate: new Date(new Date(t.created_at).getTime() + (144 * 24 * 3600000)).toISOString(),
                  imageUrl: ''
                });
              }
            }
          });

          if (piggiesList.length > 0) {
            if (statusFilter === 'all') return piggiesList;
            return piggiesList.filter((p) => p.status === statusFilter);
          }
        }
      } catch (err) {
        console.error('Telemetry piggies error:', err);
      }
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
