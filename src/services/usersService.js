/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - USERS SERVICE
   Direct sync with Supabase `profiles`, `piggies`, and `wallet_requests`
   ========================================================================== */

import { getClient } from './supabase.js';

export const usersService = {
  async getUsers() {
    const client = getClient();
    if (!client) return [];

    try {
      const [pRes, pigRes, reqRes, refRes] = await Promise.all([
        client.from('profiles').select('*').order('created_at', { ascending: false }),
        client.from('piggies').select('*'),
        client.from('wallet_requests').select('*'),
        client.from('referrals').select('*')
      ]);

      const profiles = pRes.data || [];
      const piggies = pigRes.data || [];
      const requests = reqRes.data || [];
      const referrals = refRes.data || [];

      if (profiles.length > 0) {
        return profiles.map((u) => {
          const userPiggies = piggies.filter((p) => p.user_id === u.id);
          const activePiggies = userPiggies.filter((p) => p.status === 'engorde' || p.status === 'active');
          const completedPiggies = userPiggies.filter((p) => p.status === 'completado' || p.status === 'liquidado');

          const totalCompraPiggies = userPiggies.reduce((sum, p) => sum + Number(p.investment_amount || 1000000), 0);

          const piggyCount = userPiggies.length;
          const baseRoiPct = piggyCount >= 3 ? 0.10 : (piggyCount === 2 ? 0.09 : 0.08);

          // Valor de Referencia en Mercado (Beneficio proyectado / ganado)
          const valorReferenciaMercado = userPiggies.reduce((sum, p) => {
            const inv = Number(p.investment_amount || 1000000);
            const extraRoi = Number(p.extra_roi_bonus || 0);
            return sum + Math.round(inv * (baseRoiPct + extraRoi));
          }, 0);

          const avgExtraRoi = userPiggies.length > 0
            ? userPiggies.reduce((sum, p) => sum + Number(p.extra_roi_bonus || 0), 0) / userPiggies.length
            : 0;

          const margenLabel = `${(baseRoiPct * 100).toFixed(0)}% Base${avgExtraRoi > 0 ? ` + ${(avgExtraRoi * 100).toFixed(1)}% Extra` : ''}`;

          const userReqs = requests.filter((r) => r.user_id === u.id);
          const pendingRecharges = userReqs.filter((r) => r.status === 'pending' && (r.request_type === 'recharge' || r.payment_method != null)).length;
          const pendingWithdrawals = userReqs.filter((r) => r.status === 'pending' && r.request_type === 'withdrawal').length;

          // Referidos a cargo
          const userReferrals = referrals.filter((r) => r.referrer_id === u.id);
          const profileReferrals = profiles.filter((p) => p.referred_by === u.id);
          const referralsCount = Math.max(userReferrals.length, profileReferrals.length);

          return {
            id: u.id,
            fullName: u.full_name || `Usuario (${u.id.substring(0, 6)})`,
            email: u.email || 'N/A',
            whatsapp: u.whatsapp || 'N/A',
            cedula: u.cedula || 'No registrada',
            bankName: u.bank_name || 'No registrado',
            bankAccountType: u.bank_account_type || '',
            bankAccountNumber: u.bank_account_number || '',
            bankBreveKey: u.bank_breve_key || '',
            walletBalance: Number(u.wallet_balance || 0),
            bonosConsumo: Number(u.consumption_balance || 0),
            referralCode: u.referral_code || 'Sin código',
            referralsCount,
            totalCompraPiggies,
            valorReferenciaMercado,
            margenComercialLabel: margenLabel,
            activePiggiesCount: activePiggies.length,
            totalPiggiesCount: userPiggies.length,
            pendingRecharges,
            pendingWithdrawals,
            termsAccepted: !!u.terms_accepted,
            habeasDataAccepted: !!u.habeas_data_accepted,
            createdAt: u.created_at || new Date().toISOString()
          };
        });
      }
    } catch (err) {
      console.error('Error fetching users in usersService:', err);
    }

    return [];
  }
};
