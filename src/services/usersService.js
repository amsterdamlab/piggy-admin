/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - USERS SERVICE
   Direct sync with Supabase `profiles`, `piggies`, and `wallet_requests`
   ========================================================================== */

import { getClient } from './supabase.js';
import { calculatePiggyBaseRoi, calculatePiggyProjectedReturn } from '../utils/piggyCategories.js';

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
        const profileMap = {};
        profiles.forEach((p) => {
          profileMap[p.id] = p;
        });

        return profiles.map((u) => {
          const userPiggies = piggies.filter((p) => p.user_id === u.id);
          const activePiggies = userPiggies.filter((p) => p.status === 'engorde' || p.status === 'active');
          const activeCount = activePiggies.length;

          const totalCompraPiggies = userPiggies.reduce((sum, p) => sum + Number(p.investment_amount || 1000000), 0);

          // Valor de Referencia en Mercado (Beneficio comercial proyectado o congelado según cohorte v1_legacy / v2_2026)
          const valorReferenciaMercado = userPiggies.reduce((sum, p) => {
            const calc = calculatePiggyProjectedReturn(p, Math.max(1, activeCount));
            return sum + calc.benefitAmount;
          }, 0);

          const hasActiveV2 = activePiggies.some((p) => (p.plan_version || 'v1_legacy') === 'v2_2026');
          const hasAnyV2 = userPiggies.some((p) => p.plan_version === 'v2_2026');
          const displayCohort = (hasActiveV2 || hasAnyV2 || userPiggies.length === 0) ? 'v2_2026' : 'v1_legacy';
          const baseRoiPct = calculatePiggyBaseRoi(displayCohort, Math.max(1, activeCount));

          const avgExtraRoi = userPiggies.length > 0
            ? userPiggies.reduce((sum, p) => sum + Number(p.extra_roi_bonus || 0), 0) / userPiggies.length
            : 0;

          const margenLabel = `${(baseRoiPct * 100).toFixed(0)}% Base${avgExtraRoi > 0 ? ` + ${(avgExtraRoi * 100).toFixed(1)}% Extra` : ''}`;

          const userReqs = requests.filter((r) => r.user_id === u.id);
          const pendingRecharges = userReqs.filter((r) => r.status === 'pending' && (r.request_type === 'recharge' || r.payment_method != null)).length;
          const pendingWithdrawals = userReqs.filter((r) => r.status === 'pending' && r.request_type === 'withdrawal').length;

          // Referidos a cargo (Auditoría Embajadores)
          const userReferrals = referrals
            .filter((r) => r.referrer_id === u.id)
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
          const profileReferrals = profiles.filter((p) => p.referred_by === u.id);
          const referralsCount = Math.max(userReferrals.length, profileReferrals.length);

          const referralsList = userReferrals.map((r) => {
            const refUser = profileMap[r.referred_id] || {};
            const tierCode = r.commission_tier || 'tier_1';
            const tierName = tierCode === 'tier_3' ? 'Oro' : (tierCode === 'tier_2' ? 'Plata' : 'Bronce');
            return {
              id: r.id,
              referredId: r.referred_id,
              referredName: refUser.full_name || `Participante (${String(r.referred_id || '').substring(0, 6)})`,
              referredEmail: refUser.email || 'Sin email',
              status: r.status || 'pending',
              commissionAmount: Number(r.commission_amount || 0),
              commissionTier: tierCode,
              tierName,
              completedAt: r.completed_at || null,
              createdAt: r.created_at || null
            };
          });

          const completedReferrals = referralsList.filter((r) => r.status === 'completed');
          const pendingReferrals = referralsList.filter((r) => r.status !== 'completed');
          const completedCount = completedReferrals.length;
          const ambassadorTier = completedCount >= 16
            ? 'Oro ($50.000)'
            : (completedCount >= 6 ? 'Plata ($30.000)' : 'Bronce ($20.000)');
          const totalCommissionPaid = completedReferrals.reduce((sum, r) => sum + r.commissionAmount, 0);

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
            referralsList,
            ambassadorSummary: {
              completedCount,
              pendingCount: pendingReferrals.length,
              ambassadorTier,
              totalCommissionPaid
            },
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
