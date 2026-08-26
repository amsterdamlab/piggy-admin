/* ==========================================================================
   MARKETING - CICLOS: SUB-TAB 1: GRANJA PIGGYS EXCLUSIVOS (cycle_completion_missions)
   Muestra cerditos puestos a disposición al completar ciclo y estado de compra
   ========================================================================== */

import { marketingService } from '../../services/marketingService.js';
import { DataTable } from '../../components/DataTable.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';

export class CycleMissionsTab {
  constructor(parentView) {
    this.parentView = parentView;
    this.dataTable = null;
  }

  render(data) {
    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar cerditos de ciclo completado...',
      actionButton: {
        text: 'Nueva Oferta de Ciclo',
        icon: icons.plus,
        onClick: () => this.openModal()
      },
      columns: [
        {
          header: 'ID Oferta',
          render: (row) => `<span style="font-weight: 800; font-family: monospace;"># ${row.id}</span>`
        },
        {
          header: 'Usuario / Inversionista',
          render: (row) => row.user_id ? `
            <div style="font-family: monospace; font-size: 0.8rem; color: var(--text-primary); max-width: 140px; overflow: hidden; text-overflow: ellipsis;">
              ${row.user_id}
            </div>
          ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Global / Todos</span>'
        },
        {
          header: 'Piggy ID / Tipo',
          render: (row) => row.piggy_id ? `
            <span class="badge badge-info" style="font-family: monospace;"># ${row.piggy_id}</span>
          ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Automático</span>'
        },
        {
          header: 'Bono / Valor Piggy',
          render: (row) => `
            <div style="font-weight: 800; color: var(--accent-gold); font-size: 0.9rem;">
              $${Number(row.price || 0).toLocaleString('es-CO')}
            </div>
          `
        },
        {
          header: 'Estado de Compra',
          render: (row) => `
            <span class="badge ${row.is_completed ? 'badge-success' : 'badge-warning'}">
              ${row.is_completed ? 'Comprado' : 'Disponible (No comprado)'}
            </span>
          `
        },
        {
          header: 'Expira',
          render: (row) => `<span style="font-size: 0.75rem; color: var(--text-muted);">${row.expires_at ? new Date(row.expires_at).toLocaleDateString('es-CO') : 'Sin expiración'}</span>`
        },
        {
          header: 'Fecha Disparo',
          render: (row) => `<span style="font-size: 0.75rem; color: var(--text-muted);">${row.created_at ? new Date(row.created_at).toLocaleDateString('es-CO') : '-'}</span>`
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (row) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="toggle" title="${row.is_completed ? 'Marcar No Comprado' : 'Marcar Comprado'}">
                ${row.is_completed ? 'Reabrir' : 'Completar'}
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
      marketingService.toggleCycleMissionCompleted(row.id, newStatus).then(res => {
        if (res.success) {
          row.is_completed = newStatus;
          toast.success(newStatus ? 'Oferta marcada como Comprada' : 'Oferta reabierta como Disponible');
          this.dataTable.setData(this.parentView.dataStore.cycle_completion_missions);
        } else {
          toast.error(res.error || 'Error al cambiar estado');
        }
      });
    } else if (action === 'edit') {
      this.openModal(row);
    } else if (action === 'delete') {
      if (confirm(`¿Eliminar esta oferta de cerdito exclusivo #${row.id}?`)) {
        marketingService.deleteCycleMission(row.id).then(res => {
          if (res.success) {
            toast.success('Oferta eliminada');
            this.parentView.dataStore.cycle_completion_missions = this.parentView.dataStore.cycle_completion_missions.filter(item => item.id !== row.id);
            this.dataTable.setData(this.parentView.dataStore.cycle_completion_missions);
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
      title: isEdit ? 'Editar Oferta de Granja Exclusiva' : 'Nueva Oferta de Granja Exclusiva',
      contentHtml: `
        <form id="cycle-form">
          <div class="form-group">
            <label class="form-label" for="cycle-price">Precio del Cerdito / Bono ($)</label>
            <input type="number" id="cycle-price" class="form-input" value="${item?.price || 100000}" step="5000" min="0" required />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="cycle-user">User ID (Opcional)</label>
              <input type="text" id="cycle-user" class="form-input" value="${item?.user_id || ''}" placeholder="UUID de usuario específico" />
            </div>

            <div class="form-group">
              <label class="form-label" for="cycle-piggy">Piggy ID (Opcional)</label>
              <input type="text" id="cycle-piggy" class="form-input" value="${item?.piggy_id || ''}" placeholder="UUID del Piggy" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="cycle-expires">Fecha de Expiración</label>
              <input type="date" id="cycle-expires" class="form-input" value="${item?.expires_at ? new Date(item.expires_at).toISOString().slice(0, 10) : ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="cycle-completed">Estado de Compra</label>
              <select id="cycle-completed" class="form-select">
                <option value="false" ${item?.is_completed === false ? 'selected' : ''}>Disponible (No comprado)</option>
                <option value="true" ${item?.is_completed === true ? 'selected' : ''}>Comprado / Completado</option>
              </select>
            </div>
          </div>
        </form>
      `,
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Guardar Cambios' : 'Disparar Oferta',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const price = document.querySelector('#cycle-price').value;
            const user_id = document.querySelector('#cycle-user').value.trim() || null;
            const piggy_id = document.querySelector('#cycle-piggy').value.trim() || null;
            const expires_at = document.querySelector('#cycle-expires').value;
            const is_completed = document.querySelector('#cycle-completed').value === 'true';

            const payload = {
              price: Number(price),
              user_id,
              piggy_id,
              expires_at: expires_at || null,
              is_completed
            };

            let res;
            if (isEdit) {
              res = await marketingService.updateCycleMission(item.id, payload);
            } else {
              res = await marketingService.createCycleMission(payload);
            }

            if (res.success) {
              toast.success(isEdit ? 'Oferta actualizada' : 'Oferta de cerdito creada');
              this.parentView.dataStore.cycle_completion_missions = await marketingService.getCycleMissions();
              this.dataTable.setData(this.parentView.dataStore.cycle_completion_missions);
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
