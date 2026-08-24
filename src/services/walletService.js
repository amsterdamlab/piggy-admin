import { getClient, isUsingMockData } from './supabase.js';
import { store } from '../state.js';

export const walletService = {
  async getRechargeRequests() {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { data, error } = await client
          .from('wallet_recharge_requests')
          .select('*, profiles(id, full_name, whatsapp, email, balance)')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((r) => ({
            id: r.id,
            userId: r.user_id,
            userName: r.profiles?.full_name || 'Usuario desconocido',
            userPhone: r.profiles?.whatsapp || 'N/A',
            userEmail: r.profiles?.email || 'N/A',
            userBalance: Number(r.profiles?.balance || 0),
            amount: Number(r.amount || 0),
            paymentMethod: r.payment_method || 'Bre-B / Transferencia',
            receiptUrl: r.receipt_url || '',
            referenceCode: r.reference_code || 'REF-' + r.id.substring(0, 6),
            status: r.status || 'pending',
            createdAt: r.created_at || new Date().toISOString()
          }));
        }
      } catch (e) {}
    }

    return this.getMockRecharges();
  },

  async getWithdrawalRequests() {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { data, error } = await client
          .from('wallet_requests')
          .select('*, profiles(id, full_name, whatsapp, email, balance)')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((w) => ({
            id: w.id,
            userId: w.user_id,
            userName: w.profiles?.full_name || 'Usuario desconocido',
            userPhone: w.profiles?.whatsapp || 'N/A',
            userEmail: w.profiles?.email || 'N/A',
            amount: Number(w.amount || 0),
            type: w.type || 'retiro',
            bankInfo: typeof w.bank_info === 'object' ? JSON.stringify(w.bank_info) : (w.bank_info || 'Cuenta Bancaria'),
            status: w.status || 'pending',
            createdAt: w.created_at || new Date().toISOString()
          }));
        }
      } catch (e) {}
    }

    return this.getMockWithdrawals();
  },

  async getTransactions() {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { data, error } = await client
          .from('wallet_transactions')
          .select('*, profiles(id, full_name, email)')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!error && data && data.length > 0) {
          return data.map((t) => ({
            id: t.id,
            userId: t.user_id,
            userName: t.profiles?.full_name || 'Usuario',
            amount: Number(t.amount || 0),
            type: t.type || 'transaction',
            description: t.description || 'Movimiento de saldo',
            status: t.status || 'completed',
            createdAt: t.created_at || new Date().toISOString()
          }));
        }
      } catch (e) {}
    }

    return this.getMockTransactions();
  },

  async approveRecharge(requestId, userId, amount) {
    const client = getClient();
    const creditAmount = Number(amount);

    if (client && !isUsingMockData()) {
      try {
        const { error: reqError } = await client
          .from('wallet_recharge_requests')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', requestId);

        if (reqError) throw reqError;

        const { data: profile } = await client
          .from('profiles')
          .select('balance')
          .eq('id', userId)
          .single();

        const currentBal = Number(profile?.balance || 0);
        const newBal = currentBal + creditAmount;

        await client
          .from('profiles')
          .update({ balance: newBal })
          .eq('id', userId);

        try {
          await client.from('wallet_transactions').insert({
            user_id: userId,
            amount: creditAmount,
            type: 'recharge_approved',
            description: `Recarga aprobada por Administrador ($${creditAmount.toLocaleString('es-CO')})`,
            status: 'completed'
          });
        } catch (txErr) {}

        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  },

  async rejectRecharge(requestId, reason = 'Comprobante no válido o ilegible') {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { error } = await client
          .from('wallet_recharge_requests')
          .update({
            status: 'rejected',
            notes: reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  async approveWithdrawal(requestId, userId, amount) {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { error } = await client
          .from('wallet_requests')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', requestId);

        if (error) throw error;

        try {
          await client.from('wallet_transactions').insert({
            user_id: userId,
            amount: -Number(amount),
            type: 'withdrawal_paid',
            description: `Retiro bancario liquidado y transferido exitosamente`,
            status: 'completed'
          });
        } catch (e) {}

        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  async rejectWithdrawal(requestId, userId, amount, reason = 'Datos bancarios erróneos') {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { error } = await client
          .from('wallet_requests')
          .update({
            status: 'rejected',
            notes: reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  getMockRecharges() {
    return [
      {
        id: 'rec-001',
        userId: 'usr-001',
        userName: 'Carlos Mario Restrepo',
        userPhone: '+57 312 456 7890',
        userEmail: 'carlos.restrepo@gmail.com',
        userBalance: 2450000,
        amount: 1000000,
        paymentMethod: 'Bre-B (Bancolombia)',
        receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
        referenceCode: 'BREB-99214',
        status: 'pending',
        createdAt: '2026-08-24T14:10:00Z'
      },
      {
        id: 'rec-002',
        userId: 'usr-002',
        userName: 'Valentina Gómez Cárdenas',
        userPhone: '+57 300 987 6543',
        userEmail: 'valen.gomez@hotmail.com',
        userBalance: 1100000,
        amount: 2000000,
        paymentMethod: 'QR Interbancario',
        receiptUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600',
        referenceCode: 'QR-44581',
        status: 'pending',
        createdAt: '2026-08-24T12:30:00Z'
      },
      {
        id: 'rec-003',
        userId: 'usr-003',
        userName: 'Andrés Felipe Morales',
        userPhone: '+57 315 333 2211',
        userEmail: 'af.morales@outlook.com',
        userBalance: 500000,
        amount: 1000000,
        paymentMethod: 'Transferencia Directa',
        receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
        referenceCode: 'TRF-11029',
        status: 'approved',
        createdAt: '2026-08-23T18:00:00Z'
      }
    ];
  },

  getMockWithdrawals() {
    return [
      {
        id: 'wth-001',
        userId: 'usr-004',
        userName: 'Diana Marcela Lozano',
        userPhone: '+57 318 777 8899',
        userEmail: 'diana.lozano@gmail.com',
        amount: 1100000,
        type: 'retiro',
        bankInfo: 'Bancolombia Ahorros #456-887123-09 (CC: 1144089221)',
        status: 'pending',
        createdAt: '2026-08-24T10:15:00Z'
      }
    ];
  },

  getMockTransactions() {
    return [
      {
        id: 'tx-001',
        userId: 'usr-001',
        userName: 'Carlos Mario Restrepo',
        amount: 1000000,
        type: 'recharge_approved',
        description: 'Recarga Bre-B confirmada por Admin',
        status: 'completed',
        createdAt: '2026-08-24T14:15:00Z'
      },
      {
        id: 'tx-002',
        userId: 'usr-003',
        userName: 'Andrés Felipe Morales',
        amount: -1000000,
        type: 'piggy_purchase',
        description: 'Compra de Piggy Landrace #2 en Mercado',
        status: 'completed',
        createdAt: '2026-08-23T19:00:00Z'
      }
    ];
  }
};
