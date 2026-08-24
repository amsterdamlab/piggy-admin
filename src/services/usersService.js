import { getClient, isUsingMockData } from './supabase.js';

export const usersService = {
  async getUsers() {
    const client = getClient();
    if (client && !isUsingMockData()) {
      try {
        const { data, error } = await client
          .from('profiles')
          .select('*, piggies(id, investment_amount, status)')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((u) => {
            const piggies = u.piggies || [];
            const activePiggies = piggies.filter((p) => p.status === 'engorde' || p.status === 'active').length;
            const totalInvested = piggies.reduce((acc, p) => acc + Number(p.investment_amount || 1000000), 0);

            return {
              id: u.id,
              fullName: u.full_name || 'Sin nombre',
              email: u.email || 'N/A',
              whatsapp: u.whatsapp || 'N/A',
              termsAccepted: !!u.terms_accepted,
              habeasDataAccepted: !!u.habeas_data_accepted,
              balance: Number(u.balance || u.wallet_balance || 0),
              points: Number(u.points || 0),
              activePiggies,
              totalInvested,
              createdAt: u.created_at || new Date().toISOString()
            };
          });
        }
      } catch (e) {}
    }

    return this.getMockUsers();
  },

  async adjustBalance(userId, newBalance, reason = 'Ajuste manual de Administrador') {
    const client = getClient();
    const amount = Number(newBalance);

    if (client && !isUsingMockData()) {
      try {
        const { error: profileError } = await client
          .from('profiles')
          .update({ balance: amount })
          .eq('id', userId);

        if (profileError) throw profileError;

        try {
          await client.from('wallet_transactions').insert({
            user_id: userId,
            amount: amount,
            type: 'admin_adjustment',
            description: reason,
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

  getMockUsers() {
    return [
      {
        id: 'usr-001',
        fullName: 'Carlos Mario Restrepo',
        email: 'carlos.restrepo@gmail.com',
        whatsapp: '+57 312 456 7890',
        termsAccepted: true,
        habeasDataAccepted: true,
        balance: 2450000,
        points: 450,
        activePiggies: 14,
        totalInvested: 14000000,
        createdAt: '2026-03-10T10:20:00Z'
      },
      {
        id: 'usr-002',
        fullName: 'Valentina Gómez Cárdenas',
        email: 'valen.gomez@hotmail.com',
        whatsapp: '+57 300 987 6543',
        termsAccepted: true,
        habeasDataAccepted: true,
        balance: 1100000,
        points: 280,
        activePiggies: 9,
        totalInvested: 9000000,
        createdAt: '2026-04-12T14:15:00Z'
      },
      {
        id: 'usr-003',
        fullName: 'Andrés Felipe Morales',
        email: 'af.morales@outlook.com',
        whatsapp: '+57 315 333 2211',
        termsAccepted: true,
        habeasDataAccepted: true,
        balance: 500000,
        points: 120,
        activePiggies: 6,
        totalInvested: 6000000,
        createdAt: '2026-05-01T09:00:00Z'
      },
      {
        id: 'usr-004',
        fullName: 'Diana Marcela Lozano',
        email: 'diana.lozano@gmail.com',
        whatsapp: '+57 318 777 8899',
        termsAccepted: true,
        habeasDataAccepted: true,
        balance: 0,
        points: 60,
        activePiggies: 4,
        totalInvested: 4000000,
        createdAt: '2026-05-18T16:30:00Z'
      },
      {
        id: 'usr-005',
        fullName: 'Mateo Alejandro Torres',
        email: 'mateo.torres@yahoo.com',
        whatsapp: '+57 320 111 2233',
        termsAccepted: false,
        habeasDataAccepted: false,
        balance: 0,
        points: 0,
        activePiggies: 0,
        totalInvested: 0,
        createdAt: '2026-08-20T11:45:00Z'
      }
    ];
  }
};
