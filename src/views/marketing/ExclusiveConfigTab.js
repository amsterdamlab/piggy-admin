/* ==========================================================================
   MARKETING - TAB 4: CONFIGURACIÓN DE PIGGYS EXCLUSIVOS (exclusive_piggy_config)
   ========================================================================== */

import { marketingService } from '../../services/marketingService.js';
import { DataTable } from '../../components/DataTable.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';

export class ExclusiveConfigTab {
  constructor(parentView) {
    this.parentView = parentView;
    this.dataTable = null;
  }

  render(data) {
    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar configuraciones exclusivas...',
      actionButton: {
        text: 'Nueva Configuración Exclusiva',
        icon: icons.plus,
        onClick: () => this.openModal()
      },
      columns: [
        {
          header: 'ID Configuración',
          render: (row) => `<span style="font-weight: 800; font-family: monospace;"># ${row.id}</span>`
        },
        {
          header: 'Precio de Venta',
          render: (row) => `
            <div style="font-weight: 800; color: var(--primary-pink); font-size: 0.95rem;">
              $${Number(row.price || 0).toLocaleString('es-CO')}
            </div>
          `
        },
        {
          header: 'Estado',
          render: (row) => `
            <span class="badge ${row.is_enabled ? 'badge-success' : 'badge-neutral'}">
              ${row.is_enabled ? 'Habilitado en App' : 'Deshabilitado'}
            </span>
          `
        },
        {
          header: 'Última Actualización',
          render: (row) => `<span style="font-size: 0.75rem; color: var(--text-muted);">${row.updated_at ? new Date(row.updated_at).toLocaleString('es-CO') : '-'}</span>`
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (row) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="toggle" title="${row.is_enabled ? 'Deshabilitar' : 'Habilitar'}">
                ${row.is_enabled ? 'Deshabilitar' : 'Habilitar'}
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
      const newStatus = !row.is_enabled;
      marketingService.toggleExclusiveConfigStatus(row.id, newStatus).then(res => {
        if (res.success) {
          row.is_enabled = newStatus;
          toast.success(newStatus ? 'Configuración habilitada' : 'Configuración deshabilitada');
          this.dataTable.setData(this.parentView.dataStore.exclusive_piggy_config);
        } else {
          toast.error(res.error || 'Error al cambiar estado');
        }
      });
    } else if (action === 'edit') {
      this.openModal(row);
    } else if (action === 'delete') {
      if (confirm(`¿Eliminar la configuración exclusiva #${row.id}?`)) {
        marketingService.deleteExclusiveConfig(row.id).then(res => {
          if (res.success) {
            toast.success('Configuración eliminada');
            this.parentView.dataStore.exclusive_piggy_config = this.parentView.dataStore.exclusive_piggy_config.filter(item => item.id !== row.id);
            this.dataTable.setData(this.parentView.dataStore.exclusive_piggy_config);
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
      title: isEdit ? 'Editar Cerdito Exclusivo' : 'Nueva Configuración de Cerdito Exclusivo',
      contentHtml: `
        <form id="exclusive-form">
          <div class="form-group">
            <label class="form-label" for="exclusive-price">Precio de Adquisición ($)</label>
            <input type="number" id="exclusive-price" class="form-input" placeholder="5000000" value="${item?.price || 5000000}" step="50000" min="0" required />
            <small style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.25rem; display: block;">Monto de venta del plan exclusivo para los inversionistas</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="exclusive-enabled">Disponibilidad en la App</label>
            <select id="exclusive-enabled" class="form-select">
              <option value="true" ${item?.is_enabled !== false ? 'selected' : ''}>Habilitado (Disponible para compra)</option>
              <option value="false" ${item?.is_enabled === false ? 'selected' : ''}>Deshabilitado (Agotado u oculto)</option>
            </select>
          </div>
        </form>
      `,
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Guardar Cambios' : 'Crear Configuración',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const price = document.querySelector('#exclusive-price').value;
            const is_enabled = document.querySelector('#exclusive-enabled').value === 'true';

            if (!price || Number(price) <= 0) {
              toast.error('Ingresa un precio válido');
              return;
            }

            const payload = { price: Number(price), is_enabled };
            let res;
            if (isEdit) {
              res = await marketingService.updateExclusiveConfig(item.id, payload);
            } else {
              res = await marketingService.createExclusiveConfig(payload);
            }

            if (res.success) {
              toast.success(isEdit ? 'Configuración actualizada' : 'Configuración exclusiva creada');
              this.parentView.dataStore.exclusive_piggy_config = await marketingService.getExclusiveConfigs();
              this.dataTable.setData(this.parentView.dataStore.exclusive_piggy_config);
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
