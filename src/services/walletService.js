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
        const { data, error } = await client
          .from('wallet_requests')
          .select('*')
          .or('request_type.eq.recharge,payment_method.not.is.null')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((r) => ({
            id: r.id,
            userId: r.user_id,
            userName: `Usuario ${r.user_id.substring(0, 8)}...`,
            userPhone: 'WhatsApp Registrado',
            userEmail: `user_${r.user_id.substring(0, 6)}@piggy.co`,
            userBalance: 0,
            amount: Number(r.amount || 0),
            paymentMethod: r.payment_method === 'BRE_B' ? 'Bre-B (Bancolombia)' : (r.payment_method === 'QR_CODE' ? 'Código QR Bancolombia' : (r.payment_method || 'Transferencia Bancaria')),
            receiptUrl: r.notes && r.notes.startsWith('http') ? r.notes : '',
            referenceCode: r.reference || `REF-${r.id.substring(0, 8).toUpperCase()}`,
            status: r.status || 'pending',
            notes: r.notes || '',
            createdAt: r.created_at || new Date().toISOString()
          }));
        }
        if (error) console.warn('Recharge requests error:', error.message);
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
        const { data, error } = await client
          .from('wallet_requests')
          .select('*')
          .eq('request_type', 'withdrawal')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((w) => ({
            id: w.id,
            userId: w.user_id,
            userName: `Usuario ${w.user_id.substring(0, 8)}...`,
            userPhone: 'WhatsApp Registrado',
            userEmail: `user_${w.user_id.substring(0, 6)}@piggy.co`,
            amount: Number(w.amount || 0),
            type: w.wallet_type === 'consumo' ? 'Bono Consumo' : 'Retiro Dinero',
            bankInfo: w.bank_name || 'Bancolombia / Cuenta de Ahorros',
            status: w.status === 'processed' ? 'approved' : (w.status || 'pending'),
            notes: w.notes || '',
            createdAt: w.created_at || new Date().toISOString()
          }));
        }
        if (error) console.warn('Withdrawal requests error:', error.message);
      } catch (e) {
        console.error('Wallet withdrawal requests exception:', e);
      }
    }

    return [];
  },

  async getTransactions() {
    const client = getClient();
    if (client) {
      try {
        const { data, error } = await client
          .from('wallet_transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!error && data && data.length > 0) {
          return data.map((t) => ({
            id: t.id,
            userId: t.user_id,
            userName: `Usuario ${t.user_id ? t.user_id.substring(0, 8) : 'Sistema'}...`,
            amount: Number(t.amount || 0),
            type: t.type || 'transacción',
            description: t.description || 'Movimiento en billetera',
            walletType: t.wallet_type || 'dinero',
            status: 'completed',
            createdAt: t.created_at || new Date().toISOString()
          }));
        }
        if (error) console.warn('Transactions error:', error.message);
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
        const { error } = await client
          .from('wallet_requests')
          .update({
            status: 'approved',
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
        const { error } = await client
          .from('wallet_requests')
          .update({
            status: 'processed',
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

  async rejectWithdrawal(requestId, userId, amount, reason = 'Datos bancarios erróneos') {
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
  }
};
