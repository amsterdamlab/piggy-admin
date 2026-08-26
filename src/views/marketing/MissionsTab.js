/* ==========================================================================
   MARKETING - MISIONES: SUB-TAB 1: MISIONES GLOBALES POR USUARIO (missions)
   Panorama del progreso de cada usuario y análisis de misiones donde se quedan
   ========================================================================== */

import { marketingService } from '../../services/marketingService.js';
import { DataTable } from '../../components/DataTable.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';

export class MissionsTab {
  constructor(parentView) {
    this.parentView = parentView;
    this.dataTable = null;
    this.viewMode = 'users'; // 'users' (panorama de progreso) | 'all' (listado completo)
  }

  render(data) {
    const rawMissions = data || [];
    const profiles = this.parentView.profilesList || [];

    // Calcular panorama por usuario
    const userProgress = this.calculateUserProgress(rawMissions, profiles);

    // Identificar misión con más usuarios estancados
    const frictionMap = {};
    userProgress.forEach(u => {
      if (!u.all_completed && u.current_mission_title) {
        const key = `Misión #${u.current_mission_number}: ${u.current_mission_title}`;
        frictionMap[key] = (frictionMap[key] || 0) + 1;
      }
    });

    let topFrictionMission = 'Ninguna (Todos completados)';
    let topFrictionCount = 0;
    Object.entries(frictionMap).forEach(([mission, count]) => {
      if (count > topFrictionCount) {
        topFrictionCount = count;
        topFrictionMission = `${mission} (${count} usuarios)`;
      }
    });

    const activeUsersCount = userProgress.filter(u => !u.all_completed && u.total_missions > 0).length;
    const completedUsersCount = userProgress.filter(u => u.all_completed && u.total_missions > 0).length;

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar por nombre de usuario, correo o misión actual...',
      columns: [
        {
          header: 'Nombre Usuario',
          render: (row) => `
            <div>
              <div style="font-weight: 800; color: var(--text-primary);">${row.user_name || 'Inversionista'}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">${row.user_email || row.user_id}</div>
            </div>
          `
        },
        {
          header: 'Estado Misión Actual',
          render: (row) => row.all_completed ? `
            <span class="badge badge-success">
              Todas Completadas 🎉
            </span>
          ` : `
            <span class="badge badge-warning">
              En Curso (Pendiente)
            </span>
          `
        },
        {
          header: 'N° Misión',
          render: (row) => row.current_mission_number ? `
            <span class="badge badge-info" style="font-weight: 800; font-size: 0.85rem;">
              # ${row.current_mission_number}
            </span>
          ` : '<span class="badge badge-success">Fin</span>'
        },
        {
          header: 'Nombre de la Misión',
          render: (row) => `
            <div style="font-weight: 700; color: var(--text-primary); max-width: 240px;">
              ${row.current_mission_title || '<span style="color: var(--accent-green);">Todas las misiones superadas</span>'}
            </div>
          `
        },
        {
          header: 'Recompensa',
          render: (row) => `
            <div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: 600; max-width: 260px;">
              ${row.current_mission_reward || '-'}
            </div>
          `
        },
        {
          header: 'Progreso',
          render: (row) => `
            <div style="min-width: 120px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.72rem; margin-bottom: 0.2rem;">
                <span style="font-weight: 700; color: var(--text-primary);">${row.completed_missions}/${row.total_missions}</span>
                <span style="color: var(--text-muted);">${row.progress_percent}%</span>
              </div>
              <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                <div style="width: ${row.progress_percent}%; height: 100%; background: ${row.progress_percent === 100 ? 'var(--accent-green)' : 'var(--primary-pink)'};"></div>
              </div>
            </div>
          `
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (row) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="view-details" title="Ver desglose completo de misiones">
                ${icons.eye || icons.target} Ver Misiones
              </button>
            </div>
          `
        }
      ],
      data: userProgress,
      onRowAction: (action, row) => this.handleAction(action, row)
    });

    return `
      <div class="missions-tab-container">
        <!-- Banner de análisis de fricción de misiones -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
          <div style="background: rgba(255, 75, 139, 0.08); border: 1px solid rgba(255, 75, 139, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--primary-pink); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.2rem;">
              ⚠️ Misión donde más se quedan los usuarios
            </div>
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">
              ${topFrictionMission}
            </div>
          </div>

          <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--accent-gold); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.2rem;">
              🎯 Usuarios con Misiones en Curso
            </div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary);">
              ${activeUsersCount} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">inversionistas</span>
            </div>
          </div>

          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--accent-green); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.2rem;">
              🏆 Usuarios con 100% Completado
            </div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary);">
              ${completedUsersCount} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">graduados</span>
            </div>
          </div>
        </div>

        ${this.dataTable.render()}
      </div>
    `;
  }

  calculateUserProgress(missions, profiles) {
    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.id] = p;
    });

    const userMap = {};

    missions.forEach(m => {
      const uid = m.user_id;
      if (!userMap[uid]) {
        const p = profileMap[uid] || {};
        userMap[uid] = {
          user_id: uid,
          user_name: p.full_name || p.email || `Usuario ${uid.slice(0, 8)}`,
          user_email: p.email || '',
          user_phone: p.phone || p.whatsapp || '',
          missions: []
        };
      }
      userMap[uid].missions.push(m);
    });

    // Asegurar que usuarios registrados en profiles también aparezcan
    profiles.forEach(p => {
      if (!userMap[p.id]) {
        userMap[p.id] = {
          user_id: p.id,
          user_name: p.full_name || p.email || 'Inversionista',
          user_email: p.email || '',
          user_phone: p.phone || p.whatsapp || '',
          missions: []
        };
      }
    });

    return Object.values(userMap).map(u => {
      u.missions.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      
      const total = u.missions.length;
      const completed = u.missions.filter(m => m.is_completed).length;
      const current = u.missions.find(m => !m.is_completed) || null;
      const allCompleted = total > 0 && completed === total;

      return {
        user_id: u.user_id,
        user_name: u.user_name,
        user_email: u.user_email,
        user_phone: u.user_phone,
        total_missions: total,
        completed_missions: completed,
        progress_percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        all_completed: allCompleted,
        current_mission_id: current?.id || null,
        current_mission_number: current ? (current.sort_order || current.mission_key || 1) : null,
        current_mission_title: current ? current.title : (total === 0 ? 'Sin misiones asignadas' : 'Todas completadas 🎉'),
        current_mission_reward: current ? current.reward : '-',
        missions_list: u.missions
      };
    }).sort((a, b) => {
      // Ordenar: primero los que tienen misiones pendientes para análisis rápido
      if (a.all_completed === b.all_completed) {
        return (Number(a.current_mission_number) || 99) - (Number(b.current_mission_number) || 99);
      }
      return a.all_completed ? 1 : -1;
    });
  }

  attachEvents(container) {
    if (this.dataTable) {
      this.dataTable.attachEvents(container);
    }
  }

  handleAction(action, row) {
    if (action === 'view-details') {
      this.openUserMissionsModal(row);
    }
  }

  openUserMissionsModal(userProgressRow) {
    const list = userProgressRow.missions_list || [];

    const listHtml = list.length > 0 ? list.map((m, idx) => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; margin-bottom: 0.5rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0;">
          <span class="badge badge-info" style="font-weight: 800; font-size: 0.8rem;"># ${m.sort_order || idx + 1}</span>
          <div style="min-width: 0;">
            <div style="font-weight: 700; color: var(--text-primary); font-size: 0.85rem;">${m.title}</div>
            <div style="font-size: 0.75rem; color: var(--accent-gold);">Recompensa: ${m.reward || 'Sin recompensa'}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem; margin-left: 1rem;">
          <span class="badge ${m.is_completed ? 'badge-success' : 'badge-warning'}">
            ${m.is_completed ? 'Completada' : 'Pendiente'}
          </span>
          <button class="btn btn-secondary btn-sm toggle-single-mission" data-mission-id="${m.id}" data-current="${m.is_completed}">
            ${m.is_completed ? 'Reabrir' : 'Completar'}
          </button>
        </div>
      </div>
    `).join('') : '<div class="p-4 text-center text-muted">Este usuario no tiene misiones registradas.</div>';

    modal.open({
      title: `Misiones de ${userProgressRow.user_name}`,
      contentHtml: `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 0.75rem 1rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">Progreso del Usuario</div>
              <div style="font-weight: 800; font-size: 1.1rem; color: var(--primary-pink);">
                ${userProgressRow.completed_missions} de ${userProgressRow.total_missions} completadas (${userProgressRow.progress_percent}%)
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; color: var(--text-muted);">Correo Electrónico</div>
              <div style="font-size: 0.85rem; font-family: monospace; color: var(--text-primary);">${userProgressRow.user_email || 'Sin correo'}</div>
            </div>
          </div>

          <div style="max-height: 50vh; overflow-y: auto; padding-right: 0.25rem;">
            ${listHtml}
          </div>
        </div>
      `,
      footerButtons: [
        { text: 'Cerrar', class: 'btn-secondary', onClick: (e, m) => m.close() }
      ]
    });

    // Attach toggle buttons inside modal
    setTimeout(() => {
      const modalEl = document.querySelector('.modal-container');
      if (modalEl) {
        modalEl.querySelectorAll('.toggle-single-mission').forEach(btn => {
          btn.addEventListener('click', async () => {
            const mId = btn.getAttribute('data-mission-id');
            const currentStatus = btn.getAttribute('data-current') === 'true';
            const newStatus = !currentStatus;
            btn.disabled = true;

            const res = await marketingService.toggleMissionCompleted(mId, newStatus);
            if (res.success) {
              toast.success(newStatus ? 'Misión completada' : 'Misión reabierta');
              this.parentView.dataStore.missions = await marketingService.getMissions();
              this.dataTable.setData(this.calculateUserProgress(this.parentView.dataStore.missions, this.parentView.profilesList));
              modal.close();
            } else {
              toast.error(res.error || 'Error al actualizar estado');
              btn.disabled = false;
            }
          });
        });
      }
    }, 100);
  }
}
