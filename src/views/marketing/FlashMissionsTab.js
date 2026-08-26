/* ==========================================================================
   MARKETING - TAB 2: MISIONES FLASH DE USUARIOS (user_flash_missions)
   ========================================================================== */

import { marketingService } from '../../services/marketingService.js';
import { DataTable } from '../../components/DataTable.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';

export class FlashMissionsTab {
  constructor(parentView) {
    this.parentView = parentView;
    this.dataTable = null;
  }

  render(data) {
    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar misiones flash...',
      actionButton: {
        text: 'Nueva Misión Flash',
        icon: icons.plus,
        onClick: () => this.openModal()
      },
      columns: [
        {
          header: 'Misión / Reto',
          render: (row) => `
            <div>
              <div style="font-weight: 800; color: var(--text-primary);">${row.title || 'Misión Flash'}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${row.description || 'Sin descripción'}</div>
            </div>
          `
        },
        {
          header: 'Valor / Recompensa',
          render: (row) => `
            <div style="font-weight: 800; color: var(--accent-gold); font-size: 0.9rem;">
              $${Number(row.price || 0).toLocaleString('es-CO')}
            </div>
          `
        },
        {
          header: 'Icono',
          render: (row) => `<span class="badge badge-info">${row.icon || 'zap'}</span>`
        },
        {
          header: 'Estado',
          render: (row) => `
            <span class="badge ${row.is_active ? 'badge-success' : 'badge-neutral'}">
              ${row.is_active ? 'Activa' : 'Inactiva'}
            </span>
          `
        },
        {
          header: 'Fecha',
          render: (row) => `<span style="font-size: 0.75rem; color: var(--text-muted);">${row.created_at ? new Date(row.created_at).toLocaleDateString('es-CO') : '-'}</span>`
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (row) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="toggle" title="${row.is_active ? 'Pausar' : 'Activar'}">
                ${row.is_active ? 'Pausar' : 'Activar'}
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
      const newStatus = !row.is_active;
      marketingService.toggleUserFlashMissionStatus(row.id, newStatus).then(res => {
        if (res.success) {
          row.is_active = newStatus;
          toast.success(newStatus ? 'Misión activada' : 'Misión pausada');
          this.dataTable.setData(this.parentView.dataStore.user_flash_missions);
        } else {
          toast.error(res.error || 'Error al cambiar estado');
        }
      });
    } else if (action === 'edit') {
      this.openModal(row);
    } else if (action === 'delete') {
      if (confirm(`¿Eliminar la misión "${row.title}"?`)) {
        marketingService.deleteUserFlashMission(row.id).then(res => {
          if (res.success) {
            toast.success('Misión eliminada');
            this.parentView.dataStore.user_flash_missions = this.parentView.dataStore.user_flash_missions.filter(item => item.id !== row.id);
            this.dataTable.setData(this.parentView.dataStore.user_flash_missions);
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
      title: isEdit ? 'Editar Misión Flash' : 'Nueva Misión Flash',
      contentHtml: `
        <form id="flash-form">
          <div class="form-group">
            <label class="form-label" for="flash-title">Título de la Misión</label>
            <input type="text" id="flash-title" class="form-input" placeholder="Ej: Flash: Alimenta a tu Piggy hoy" value="${item?.title || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="flash-desc">Descripción / Instrucciones</label>
            <textarea id="flash-desc" class="form-textarea" placeholder="Explica cómo el usuario completa este reto...">${item?.description || ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-price">Valor / Recompensa ($)</label>
              <input type="number" id="flash-price" class="form-input" value="${item?.price || 50000}" step="1000" min="0" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="flash-icon">Nombre de Icono</label>
              <input type="text" id="flash-icon" class="form-input" value="${item?.icon || 'zap'}" placeholder="zap, award, gift..." />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-campaign">Campaign ID (Opcional)</label>
              <input type="text" id="flash-campaign" class="form-input" value="${item?.campaign_id || ''}" placeholder="UUID o Código de campaña" />
            </div>

            <div class="form-group">
              <label class="form-label" for="flash-active">Estado</label>
              <select id="flash-active" class="form-select">
                <option value="true" ${item?.is_active !== false ? 'selected' : ''}>Activa</option>
                <option value="false" ${item?.is_active === false ? 'selected' : ''}>Inactiva</option>
              </select>
            </div>
          </div>
        </form>
      `,
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Guardar Cambios' : 'Lanzar Misión',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const title = document.querySelector('#flash-title').value.trim();
            const description = document.querySelector('#flash-desc').value.trim();
            const price = document.querySelector('#flash-price').value;
            const icon = document.querySelector('#flash-icon').value.trim();
            const campaign_id = document.querySelector('#flash-campaign').value.trim() || null;
            const is_active = document.querySelector('#flash-active').value === 'true';

            if (!title) {
              toast.error('Ingresa el título de la misión');
              return;
            }

            const payload = { title, description, price: Number(price), icon, campaign_id, is_active };
            let res;
            if (isEdit) {
              res = await marketingService.updateUserFlashMission(item.id, payload);
            } else {
              res = await marketingService.createUserFlashMission(payload);
            }

            if (res.success) {
              toast.success(isEdit ? 'Misión actualizada' : 'Misión Flash creada con éxito');
              this.parentView.dataStore.user_flash_missions = await marketingService.getUserFlashMissions();
              this.dataTable.setData(this.parentView.dataStore.user_flash_missions);
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
