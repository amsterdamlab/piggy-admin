/* ==========================================================================
   MARKETING - MISIONES: SUB-TAB 1: MISIONES GLOBALES (missions)
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
  }

  render(data) {
    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar misiones globales del sistema...',
      actionButton: {
        text: 'Nueva Misión Global',
        icon: icons.plus,
        onClick: () => this.openModal()
      },
      columns: [
        {
          header: 'Misión del Sistema',
          render: (row) => `
            <div style="font-weight: 800; color: var(--text-primary);">${row.title || 'Misión'}</div>
          `
        },
        {
          header: 'Recompensa',
          render: (row) => `
            <div style="font-weight: 800; color: var(--accent-gold); font-size: 0.9rem;">
              ${row.reward ? `$${Number(row.reward).toLocaleString('es-CO')}` : 'Puntos'}
            </div>
          `
        },
        {
          header: 'Icono',
          render: (row) => `<span class="badge badge-info">${row.icon || 'target'}</span>`
        },
        {
          header: 'Orden',
          render: (row) => `<span class="badge badge-neutral"># ${row.sort_order ?? 0}</span>`
        },
        {
          header: 'Estado',
          render: (row) => `
            <span class="badge ${row.is_completed ? 'badge-success' : 'badge-warning'}">
              ${row.is_completed ? 'Completada' : 'Pendiente'}
            </span>
          `
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (row) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="toggle" title="${row.is_completed ? 'Marcar Pendiente' : 'Marcar Completada'}">
                ${row.is_completed ? 'Pendiente' : 'Completar'}
              </button>
              <button class="btn btn-secondary btn-sm" data-action="edit" title="Editar">
                ${icons.edit}
              </button>
              <button class="btn btn-secondary btn-sm" data-action="delete" style="color: var(--accent-red);" title="Eliminar">
                ${icons.trash}
              </button>
            </div>
          `
        }
      ],
      data: data || [],
      onRowAction: (action, row) => this.handleAction(action, row)
    });

    return this.dataTable.render();
  }

  attachEvents(container) {
    if (this.dataTable) {
      this.dataTable.attachEvents(container);
    }
  }

  handleAction(action, row) {
    if (action === 'toggle') {
      const newStatus = !row.is_completed;
      marketingService.toggleMissionCompleted(row.id, newStatus).then(res => {
        if (res.success) {
          row.is_completed = newStatus;
          toast.success(newStatus ? 'Misión completada' : 'Misión reabierta');
          this.dataTable.setData(this.parentView.dataStore.missions);
        } else {
          toast.error(res.error || 'Error al cambiar estado');
        }
      });
    } else if (action === 'edit') {
      this.openModal(row);
    } else if (action === 'delete') {
      if (confirm(`¿Eliminar la misión "${row.title}"?`)) {
        marketingService.deleteMission(row.id).then(res => {
          if (res.success) {
            toast.success('Misión eliminada');
            this.parentView.dataStore.missions = this.parentView.dataStore.missions.filter(item => item.id !== row.id);
            this.dataTable.setData(this.parentView.dataStore.missions);
            this.parentView.updateBadges();
          } else {
            toast.error(res.error || 'Error al eliminar');
          }
        });
      }
    }
  }

  openModal(item = null) {
    const isEdit = Boolean(item);
    modal.open({
      title: isEdit ? 'Editar Misión Global' : 'Nueva Misión Global',
      contentHtml: `
        <form id="mission-catalog-form">
          <div class="form-group">
            <label class="form-label" for="mission-title">Título de la Misión</label>
            <input type="text" id="mission-title" class="form-input" placeholder="Ej: Compra tu primer cerdito de ahorro" value="${item?.title || ''}" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="mission-reward">Recompensa / Valor ($)</label>
              <input type="number" id="mission-reward" class="form-input" value="${item?.reward || 10000}" step="1000" min="0" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="mission-icon">Icono</label>
              <input type="text" id="mission-icon" class="form-input" value="${item?.icon || 'target'}" placeholder="target, pig, star..." />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="mission-order">Orden de Aparición</label>
              <input type="number" id="mission-order" class="form-input" value="${item?.sort_order ?? 1}" min="0" />
            </div>

            <div class="form-group">
              <label class="form-label" for="mission-completed">Estado</label>
              <select id="mission-completed" class="form-select">
                <option value="false" ${item?.is_completed === false ? 'selected' : ''}>Pendiente / Activa</option>
                <option value="true" ${item?.is_completed === true ? 'selected' : ''}>Completada</option>
              </select>
            </div>
          </div>
        </form>
      `,
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Guardar Cambios' : 'Crear Misión',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const title = document.querySelector('#mission-title').value.trim();
            const reward = document.querySelector('#mission-reward').value;
            const icon = document.querySelector('#mission-icon').value.trim();
            const sort_order = document.querySelector('#mission-order').value;
            const is_completed = document.querySelector('#mission-completed').value === 'true';

            if (!title) {
              toast.error('Ingresa el título de la misión');
              return;
            }

            const payload = { title, reward: Number(reward), icon, sort_order: Number(sort_order), is_completed };
            let res;
            if (isEdit) {
              res = await marketingService.updateMission(item.id, payload);
            } else {
              res = await marketingService.createMission(payload);
            }

            if (res.success) {
              toast.success(isEdit ? 'Misión actualizada' : 'Misión creada con éxito');
              this.parentView.dataStore.missions = await marketingService.getMissions();
              this.dataTable.setData(this.parentView.dataStore.missions);
              this.parentView.updateBadges();
              m.close();
            } else {
              toast.error(res.error || 'Error al guardar');
            }
          }
        }
      ]
    });
  }
}
