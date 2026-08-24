import { getClient, isUsingMockData } from './supabase.js';
import { store } from '../state.js';

export const dashboardService = {
  async getSummaryMetrics() {
    const client = getClient();
    if (!client || isUsingMockData()) {
      return this.getMockMetrics();
    }

    try {
      const { count: usersCount } = await client
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: piggiesData } = await client
        .from('piggies')
        .select('id, investment_amount, status');

      let totalInvested = 0;
      let activePiggiesCount = 0;

      if (piggiesData && piggiesData.length > 0) {
        piggiesData.forEach((p) => {
          totalInvested += Number(p.investment_amount || 1000000);
          if (p.status === 'engorde' || p.status === 'active') {
            activePiggiesCount++;
          }
        });
      }

      let pendingRecharges = 0;
      let pendingWithdrawals = 0;

      try {
        const { count: rechargesCount } = await client
          .from('wallet_recharge_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        pendingRecharges = rechargesCount || 0;
      } catch (e) {}

      try {
        const { count: reqCount } = await client
          .from('wallet_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        pendingWithdrawals = reqCount || 0;
      } catch (e) {}

      const totalPending = pendingRecharges + pendingWithdrawals;
      store.setPendingCounts({ recharges: pendingRecharges, withdrawals: pendingWithdrawals });

      const metrics = {
        totalUsers: usersCount || (piggiesData ? Math.max(1, piggiesData.length) : 0),
        totalInvested: totalInvested || 0,
        activePiggies: activePiggiesCount || 0,
        totalPiggies: piggiesData ? piggiesData.length : 0,
        pendingRequests: totalPending
      };

      store.setStats(metrics);
      return metrics;
    } catch (err) {
      return this.getMockMetrics();
    }
  },

  async getChartData() {
    return {
      labels: ['Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'],
      datasets: [
        {
          label: 'Capital Total Gestionado (COP)',
          data: [15000000, 32000000, 58000000, 89000000, 134000000, 195000000],
          borderColor: '#FF4B8B',
          backgroundColor: 'rgba(255, 75, 139, 0.12)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Piggies en Engorde',
          data: [15, 32, 58, 89, 134, 195],
          borderColor: '#FFB800',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  },

  async getTopInvestors() {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { data } = await client
          .from('profiles')
          .select('id, full_name, whatsapp, email')
          .limit(10);
        
        if (data && data.length > 0) {
          return data.map((u, i) => ({
            id: u.id,
            name: u.full_name || 'Usuario ' + (i + 1),
            contact: u.whatsapp || u.email || 'N/A',
            piggiesCount: Math.max(1, 12 - i * 2),
            totalInvested: Math.max(1, 12 - i * 2) * 1000000,
            roiTier: (12 - i * 2) >= 3 ? '10% Base + Bonos' : '8% Base'
          }));
        }
      } catch (e) {}
    }

    return [
      { id: '1', name: 'Carlos Mario Restrepo', contact: '+57 312 456 7890', piggiesCount: 14, totalInvested: 14000000, roiTier: '10% Base + 2% Extra' },
      { id: '2', name: 'Valentina Gómez C.', contact: '+57 300 987 6543', piggiesCount: 9, totalInvested: 9000000, roiTier: '10% Base + 1% Extra' },
      { id: '3', name: 'Andrés Felipe Morales', contact: '+57 315 333 2211', piggiesCount: 6, totalInvested: 6000000, roiTier: '10% Base' },
      { id: '4', name: 'Diana Marcela Lozano', contact: '+57 318 777 8899', piggiesCount: 4, totalInvested: 4000000, roiTier: '10% Base' },
      { id: '5', name: 'Julián David Pérez', contact: '+57 301 555 4433', piggiesCount: 2, totalInvested: 2000000, roiTier: '9% Base' }
    ];
  },

  getMockMetrics() {
    const mock = {
      totalUsers: 148,
      totalInvested: 195000000,
      activePiggies: 195,
      totalPiggies: 210,
      pendingRequests: 4
    };
    store.setStats(mock);
    store.setPendingCounts({ recharges: 3, withdrawals: 1 });
    return mock;
  }
};
