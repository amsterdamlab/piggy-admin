/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - WALLET SERVICE
   Direct sync with Supabase `wallet_requests` & `wallet_transactions` tables
   ========================================================================== */

import { getClient } from './supabase.js';
import { store } from '../state.js';

export const walletService = {
  async getRechargeRequests() {
    const client = getClient();
    if (client) {
      try {
        const [reqRes, profRes] = await Promise.all([
          client
            .from('wallet_requests')
            .select('*')
            .order('created_at', { ascending: false }),
          client.from('profiles').select('id, full_name, whatsapp, email, wallet_balance')
        ]);

        const rawData = reqRes.data || [];
        // Filtrar exclusivamente recargas de saldo
        const data = rawData.filter(r => r.request_type === 'recharge' || (!r.request_type && r.payment_method && r.wallet_type !== 'bono_consumo' && r.wallet_type !== 'consumo'));
        const profiles = profRes.data || [];
        const profileMap = {};
        profiles.forEach(p => { profileMap[p.id] = p; });

        if (!reqRes.error && data) {
          return data.map((r) => {
            const user = profileMap[r.user_id] || {};
            return {
              id: r.id,
              userId: r.user_id,
              userName: user.full_name || `Usuario ${r.user_id ? r.user_id.substring(0, 8) : 'N/A'}...`,
              userPhone: user.whatsapp || 'No registrado',
              userEmail: user.email || (r.user_id ? `user_${r.user_id.substring(0, 6)}@piggy.co` : ''),
              userBalance: Number(user.wallet_balance || 0),
              amount: Number(r.amount || 0),
              paymentMethod: r.payment_method === 'BRE_B' ? 'Bre-B (Bancolombia)' : (r.payment_method === 'QR_CODE' ? 'Código QR Bancolombia' : (r.payment_method || 'Transferencia Bancaria')),
              receiptUrl: r.notes && r.notes.startsWith('http') ? r.notes : '',
              referenceCode: r.reference || `REF-${r.id ? r.id.substring(0, 8).toUpperCase() : 'PEND'}`,
              status: r.status || 'pending',
              notes: r.notes || '',
              createdAt: r.created_at || new Date().toISOString()
            };
          });
        }
        if (reqRes.error) console.warn('Recharge requests error:', reqRes.error.message);
      } catch (e) {
        console.error('Wallet recharge requests exception:', e);
      }
    }

    return [];
  },

  async getWithdrawalRequests() {
    const client = getClient();
    if (client) {
      try {
        const [reqRes, profRes] = await Promise.all([
          client
            .from('wallet_requests')
            .select('*')
            .order('created_at', { ascending: false }),
          client.from('profiles').select('id, full_name, whatsapp, email, wallet_balance')
        ]);

        const rawData = reqRes.data || [];
        // Filtrar exclusivamente retiros de dinero
        const data = rawData.filter(r => r.request_type === 'withdrawal');
        const profiles = profRes.data || [];
        const profileMap = {};
        profiles.forEach(p => { profileMap[p.id] = p; });

        if (!reqRes.error && data) {
          return data.map((w) => {
            const user = profileMap[w.user_id] || {};
            return {
              id: w.id,
              userId: w.user_id,
              userName: user.full_name || `Usuario ${w.user_id ? w.user_id.substring(0, 8) : 'N/A'}...`,
              userPhone: user.whatsapp || 'No registrado',
              userEmail: user.email || (w.user_id ? `user_${w.user_id.substring(0, 6)}@piggy.co` : ''),
              userBalance: Number(user.wallet_balance || 0),
              amount: Number(w.amount || 0),
              type: 'Retiro Dinero (Bancario)',
              bankInfo: w.bank_name || 'Bancolombia / Cuenta de Ahorros',
              referenceCode: w.reference || `RET-${w.id ? w.id.substring(0, 8).toUpperCase() : 'PEND'}`,
              status: w.status === 'processed' ? 'approved' : (w.status || 'pending'),
              notes: w.notes || '',
              createdAt: w.created_at || new Date().toISOString()
            };
          });
        }
        if (reqRes.error) console.warn('Withdrawal requests error:', reqRes.error.message);
      } catch (e) {
        console.error('Wallet withdrawal requests exception:', e);
      }
    }

    return [];
  },

  async getMeatRequests() {
    const client = getClient();
    if (client) {
      try {
        const [reqRes, profRes] = await Promise.all([
          client
            .from('wallet_requests')
            .select('*')
            .order('created_at', { ascending: false }),
          client.from('profiles').select('id, full_name, whatsapp, email, wallet_balance, referral_balance')
        ]);

        const rawData = reqRes.data || [];
        // Filtrar solicitudes de carne o consumo
        const data = rawData.filter(r =>
          r.request_type === 'consumption' ||
          r.request_type === 'meat' ||
          r.request_type === 'bonus_debit' ||
          r.wallet_type === 'bono_consumo' ||
          r.wallet_type === 'consumo'
        );
        const profiles = profRes.data || [];
        const profileMap = {};
        profiles.forEach(p => { profileMap[p.id] = p; });

        if (!reqRes.error && data) {
          return data.map((m) => {
            const user = profileMap[m.user_id] || {};
            const isBonoWallet = m.wallet_type === 'bono_consumo' || m.wallet_type === 'consumo';
            return {
              id: m.id,
              userId: m.user_id,
              userName: user.full_name || `Usuario ${m.user_id ? m.user_id.substring(0, 8) : 'N/A'}...`,
              userPhone: user.whatsapp || 'No registrado',
              userEmail: user.email || (m.user_id ? `user_${m.user_id.substring(0, 6)}@piggy.co` : ''),
              userBalance: Number(user.wallet_balance || 0),
              userBonos: Number(user.referral_balance || 0),
              walletType: isBonoWallet ? 'consumo' : 'dinero',
              amount: Number(m.amount || 0),
              type: isBonoWallet ? 'Canje por Bonos' : 'Compra con Saldo Cuenta Agro',
              referenceCode: m.reference || `CRN-${m.id ? m.id.substring(0, 8).toUpperCase() : 'PEND'}`,
              status: m.status === 'processed' ? 'approved' : (m.status || 'pending'),
              notes: m.notes || 'Despacho de productos de carne / Granja Gourmet',
              createdAt: m.created_at || new Date().toISOString()
            };
          });
        }
        if (reqRes.error) console.warn('Meat requests error:', reqRes.error.message);
      } catch (e) {
        console.error('Wallet meat requests exception:', e);
      }
    }

    return [];
  },

  /**
   * LIBRO MAYOR CONTABLE (AUDITORÍA 1:1)
   * REGLA ESTRICTA DE ARQUITECTURA:
   * Esta consulta debe retornar SIEMPRE el 100% de los registros de `wallet_transactions`
   * sin aplicar ningún filtro que omita o altere movimientos. Todas las transacciones (abonos,
   * débitos, recargas, ajustes o errores previos) deben ser transparentes e inmutables.
   */
  async getTransactions() {
    const client = getClient();
    if (client) {
      try {
        const [txRes, profRes] = await Promise.all([
          client
            .from('wallet_transactions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500),
          client.from('profiles').select('id, full_name, email, whatsapp')
        ]);

        const data = txRes.data || [];
        const profiles = profRes.data || [];
        const profileMap = {};
        profiles.forEach(p => { profileMap[p.id] = p; });

        if (!txRes.error && data) {
          return data.map((t) => {
            const user = profileMap[t.user_id] || {};
            return {
              id: t.id,
              userId: t.user_id,
              userName: user.full_name || (t.user_id ? `Usuario ${t.user_id.substring(0, 8)}...` : 'Sistema'),
              userEmail: user.email || '',
              userPhone: user.whatsapp || '',
              amount: Number(t.amount || 0),
              type: t.type || 'transacción',
              description: t.description || 'Movimiento en billetera',
              walletType: t.wallet_type || 'dinero',
              status: 'completed',
              createdAt: t.created_at || new Date().toISOString()
            };
          });
        }
        if (txRes.error) console.warn('Transactions error:', txRes.error.message);
      } catch (e) {
        console.error('Wallet transactions exception:', e);
      }
    }

    return [];
  },

  async approveRecharge(requestId, userId, amount) {
    const client = getClient();
    if (client) {
      try {
        const now = new Date().toISOString();

        // 1. Actualizar estado de solicitud a 'approved'.
        // El trigger en PostgreSQL (Supabase) inserta automáticamente la transacción
        // contable correspondiente con la referencia original y acredita el saldo en profiles.
        const { error } = await client
          .from('wallet_requests')
          .update({
            status: 'approved',
            processed_at: now,
            processed_by: 'admin'
          })
          .eq('id', requestId);

        if (error) throw error;

        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    return { success: false, error: 'No client' };
  },

  async rejectRecharge(requestId, reason = 'Comprobante no válido') {
    const client = getClient();
    if (client) {
      try {
        const { error } = await client
          .from('wallet_requests')
          .update({
            status: 'rejected',
            notes: reason,
            processed_at: new Date().toISOString(),
            processed_by: 'admin'
          })
          .eq('id', requestId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'No client' };
  },

  async approveWithdrawal(requestId, userId, amount) {
    const client = getClient();
    if (client) {
      try {
        const now = new Date().toISOString();

        // 1. Actualizar estado de solicitud a 'approved'.
        // Nota: En las solicitudes de retiro creadas por clientes desde la app móvil, el saldo
        // fue retenido/debitado previamente al momento de la solicitud ("Retención por solicitud en proceso").
        // Al liquidar aquí, solo se confirma y aprueba el despacho del dinero.
        const { error: reqErr } = await client
          .from('wallet_requests')
          .update({
            status: 'approved',
            processed_at: now,
            processed_by: 'admin'
          })
          .eq('id', requestId);

        if (reqErr) throw reqErr;

        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'No client' };
  },

  async rejectWithdrawal(requestId, userId, amount, reason = 'Datos bancarios erróneos') {
    const client = getClient();
    if (client) {
      try {
        // Al rechazar la solicitud, el trigger de base de datos genera la "Devolución por retiro bancario no procesado"
        const { error } = await client
          .from('wallet_requests')
          .update({
            status: 'rejected',
            notes: reason,
            processed_at: new Date().toISOString(),
            processed_by: 'admin'
          })
          .eq('id', requestId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'No client' };
  },

  async approveMeatRequest(requestId, userId, amount, walletType = 'dinero') {
    const client = getClient();
    if (client) {
      try {
        const now = new Date().toISOString();

        // 1. Actualizar estado de solicitud a approved.
        // Las solicitudes de carne del cliente ya retienen el saldo/bono al crearse.
        const { error } = await client
          .from('wallet_requests')
          .update({
            status: 'approved',
            processed_at: now,
            processed_by: 'admin'
          })
          .eq('id', requestId);

        if (error) throw error;

        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'No client' };
  },

  async rejectMeatRequest(requestId, userId, amount, reason = 'Entrega cancelada o no coordinada') {
    const client = getClient();
    if (client) {
      try {
        const { error } = await client
          .from('wallet_requests')
          .update({
            status: 'rejected',
            notes: reason,
            processed_at: new Date().toISOString(),
            processed_by: 'admin'
          })
          .eq('id', requestId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'No client' };
  },

  async getUsersList() {
    const client = getClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('id, full_name, email, whatsapp, cedula, bank_name, wallet_balance, referral_balance')
          .order('full_name', { ascending: true });

        if (!error && data) return data;
      } catch (e) {
        console.error('Error fetching users list in walletService:', e);
      }
    }
    return [];
  },

  async createManualRequest({ userId, userName, requestType, amount, paymentMethod, reference, bankName, notes, initialStatus = 'approved', isMassive = false }) {
    const client = getClient();
    if (!client) return { success: false, error: 'No client' };

    try {
      const isApproved = initialStatus === 'approved' || initialStatus === 'processed';
      const numAmount = Math.abs(Number(amount));
      const now = new Date().toISOString();

      // Clasificación estricta de la operación
      let isCredit = true;
      let targetWallet = 'dinero';
      let reqType = 'recharge';
      let txType = 'recharge';
      let prefix = 'REC';
      let defaultDesc = 'Operación manual';

      if (requestType === 'bonus_grant') {
        isCredit = true;
        targetWallet = 'consumo';
        reqType = 'recharge';
        txType = 'credit';
        prefix = 'BNO';
        defaultDesc = 'Bono de Consumo:';
      } else if (requestType === 'bonus_debit') {
        isCredit = false;
        targetWallet = 'consumo';
        reqType = 'consumption';
        txType = 'debit';
        prefix = 'CRN';
        defaultDesc = 'Débito Bono de Consumo:';
      } else if (requestType === 'recharge') {
        isCredit = true;
        targetWallet = 'dinero';
        reqType = 'recharge';
        txType = 'recharge';
        prefix = 'REC';
        defaultDesc = 'Recarga Manual Cuenta Agro:';
      } else if (requestType === 'withdrawal') {
        isCredit = false;
        targetWallet = 'dinero';
        reqType = 'withdrawal';
        txType = 'debit';
        prefix = 'RET';
        defaultDesc = 'Retiro Manual de Dinero:';
      } else if (requestType === 'consumption') {
        isCredit = false;
        targetWallet = 'dinero'; // Cuenta Agro por defecto para compra de carne
        reqType = 'consumption';
        txType = 'debit';
        prefix = 'CRN';
        defaultDesc = 'Venta de Carne en Granja (Despacho):';
      }

      // Caso 1: Abono Masivo a Todos los Usuarios Activos
      if (isMassive || userId === 'ALL') {
        const users = await this.getUsersList();
        if (!users || users.length === 0) {
          return { success: false, error: 'No se encontraron usuarios para procesar el abono masivo' };
        }

        const baseRef = reference || `MKT-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
        const reqInserts = [];
        const txInserts = [];

        for (let idx = 0; idx < users.length; idx++) {
          const u = users[idx];
          const userRef = `${baseRef}-${idx + 1}`;
          reqInserts.push({
            user_id: u.id,
            user_name: u.full_name || 'Inversionista',
            request_type: reqType,
            amount: numAmount,
            payment_method: paymentMethod || 'CAMPAÑA_MARKETING',
            reference: userRef,
            bank_name: null,
            wallet_type: targetWallet,
            notes: notes || `${defaultDesc} Campaña de Marketing Granja`,
            status: isApproved ? 'approved' : 'pending',
            created_at: now,
            processed_at: isApproved ? now : null,
            processed_by: isApproved ? 'admin' : null
          });

          if (isApproved) {
            txInserts.push({
              user_id: u.id,
              amount: isCredit ? numAmount : -numAmount,
              type: txType,
              description: `${defaultDesc} ${notes || 'Campaña Masiva'} [Ref: ${userRef}]`.trim(),
              wallet_type: targetWallet,
              payment_method: paymentMethod || 'MARKETING',
              simulation_status: 'APPROVED',
              created_at: now
            });

            // Actualizar balance de cada usuario
            if (targetWallet === 'dinero') {
              const currentVal = Number(u.wallet_balance || 0);
              const updatedVal = isCredit ? (currentVal + numAmount) : Math.max(0, currentVal - numAmount);
              await client.from('profiles').update({ wallet_balance: updatedVal }).eq('id', u.id);
            } else if (targetWallet === 'consumo') {
              const currentVal = Number(u.referral_balance || 0);
              const updatedVal = isCredit ? (currentVal + numAmount) : Math.max(0, currentVal - numAmount);
              await client.from('profiles').update({ referral_balance: updatedVal }).eq('id', u.id);
            }
          }
        }

        const batchSize = 50;
        for (let i = 0; i < reqInserts.length; i += batchSize) {
          await client.from('wallet_requests').insert(reqInserts.slice(i, i + batchSize));
        }

        if (isApproved && txInserts.length > 0) {
          for (let i = 0; i < txInserts.length; i += batchSize) {
            await client.from('wallet_transactions').insert(txInserts.slice(i, i + batchSize));
          }
        }

        return { success: true, count: users.length, mass: true };
      }

      // Caso 2: Solicitud / Operación a Usuario Individual
      const singleRef = reference || `ADM-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

      const insertData = {
        user_id: userId,
        user_name: userName || 'Usuario',
        request_type: reqType,
        amount: numAmount,
        payment_method: paymentMethod || (reqType === 'consumption' ? 'DESPACHO_GRANJA' : null),
        reference: singleRef,
        bank_name: bankName || (reqType === 'withdrawal' ? 'Transferencia Bancaria' : null),
        wallet_type: targetWallet,
        notes: notes || `${defaultDesc} Registrada desde panel administrativo`,
        status: isApproved ? 'approved' : 'pending',
        created_at: now,
        processed_at: isApproved ? now : null,
        processed_by: isApproved ? 'admin' : null
      };

      const { data, error } = await client
        .from('wallet_requests')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Si está aprobado inmediatamente, insertar en wallet_transactions con signo correcto y actualizar profile
      if (isApproved) {
        try {
          // 1. Insertar transacción contable (con monto negativo si es débito)
          const { error: txErr } = await client.from('wallet_transactions').insert({
            user_id: userId,
            amount: isCredit ? numAmount : -numAmount,
            type: txType,
            description: `${defaultDesc} ${notes || ''} [Ref: ${singleRef}]`.trim(),
            wallet_type: targetWallet,
            payment_method: paymentMethod || 'MANUAL_ADMIN',
            simulation_status: 'APPROVED',
            created_at: now
          });

          if (txErr) console.warn('Error al insertar transacción en wallet_transactions:', txErr);

          // 2. Actualizar perfil
          const { data: profile } = await client.from('profiles').select('wallet_balance, referral_balance').eq('id', userId).single();
          if (profile) {
            if (targetWallet === 'dinero') {
              const currentVal = Number(profile.wallet_balance || 0);
              const updatedVal = isCredit ? (currentVal + numAmount) : Math.max(0, currentVal - numAmount);
              const { error: profErr } = await client.from('profiles').update({ wallet_balance: updatedVal }).eq('id', userId);
              if (profErr) console.warn('Error al actualizar wallet_balance:', profErr);
            } else if (targetWallet === 'consumo') {
              const currentVal = Number(profile.referral_balance || 0);
              const updatedVal = isCredit ? (currentVal + numAmount) : Math.max(0, currentVal - numAmount);
              const { error: profErr } = await client.from('profiles').update({ referral_balance: updatedVal }).eq('id', userId);
              if (profErr) console.warn('Error al actualizar referral_balance:', profErr);
            }
          }
        } catch (txErr) {
          console.warn('Advertencia actualizando saldo o insertando transacción:', txErr);
        }
      }

      return { success: true, data };
    } catch (err) {
      console.error('Error in createManualRequest:', err);
      return { success: false, error: err.message };
    }
  }
};
