/* ==========================================================================
   MARKETING - CICLOS: SUB-TAB 2: PIGGYS EXCLUSIVOS CONFIG (exclusive_piggy_config)
   Configuración de precios, bonos ROI y cerditos a disparar según granja del usuario
   ========================================================================== */

import { marketingService } from '../../services/marketingService.js';
import { DataTable } from '../../components/DataTable.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';
import { formatCurrency, parseCurrency, setupCurrencyInput } from '../../utils/formUtils.js';

export class ExclusiveConfigTab {
  constructor(parentView) {
    this.parentView = parentView;
    this.dataTable = null;
  }

  render(data) {
    const rawData = data || [];

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar cerditos exclusivos por nombre o tipo...',
      actionButton: {
        text: 'Nuevo Piggy Exclusivo',
        icon: icons.plus,
        onClick: () => this.openModal()
      },
      columns: [
        {
          header: 'Tipo Piggy',
          render: (row) => {
            const bonusPercent = Number(row.extra_roi_bonus || 0) * 100;
            return `
              <div>
                <div style="font-weight: 800; color: var(--text-primary); font-size: 0.95rem;">
                  ${row.piggy_label || row.piggy_type || 'Piggy Exclusivo'}
                </div>
                <div style="font-size: 0.75rem; color: var(--accent-gold); font-weight: 700; margin-top: 2px;">
                  +${bonusPercent.toFixed(0)}% ROI Bono
                </div>
              </div>
            `;
          }
        },
        {
          header: 'Precio Venta',
          render: (row) => `
            <div style="font-weight: 800; color: var(--accent-gold); font-size: 0.95rem;">
              $${Number(row.price || 0).toLocaleString('es-CO')}
            </div>
          `
        },
        {
          header: 'Min. Piggys',
          render: (row) => `
            <span class="badge badge-info" style="font-weight: 800; font-size: 0.82rem;">
              ≥ ${row.min_piggies || 1} ${(row.min_piggies || 1) === 1 ? 'Piggy' : 'Piggys'}
            </span>
          `
        },
        {
          header: 'Disponibilidad',
          render: (row) => `
            <div>
              <span class="badge ${row.is_enabled ? 'badge-success' : 'badge-neutral'}">
                ${row.is_enabled ? 'Habilitado' : 'Deshabilitado'}
              </span>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px; font-family: monospace;">
                ⏳ ${row.duration_hours || 48} horas de vigencia
              </div>
            </div>
          `
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
      data: rawData,
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
          this.parentView.updateBadges();
        } else {
          toast.error(res.error || 'Error al cambiar estado');
        }
      });
    } else if (action === 'edit') {
      this.openModal(row);
    } else if (action === 'delete') {
      if (confirm(`¿Eliminar la configuración "${row.piggy_label || row.piggy_type}"?`)) {
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
    const isEdit = Boolean(item && item.id);
    const bonusPercent = Number(item?.extra_roi_bonus || 0.02) * 100;

    modal.open({
      title: isEdit ? 'Editar Piggy Exclusivo' : 'Nuevo Piggy Exclusivo',
      contentHtml: `
        <form id="exclusive-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="exclusive-label">Nombre / Etiqueta del Piggy</label>
              <input type="text" id="exclusive-label" class="form-input" placeholder="Ej: Piggy Dorado" value="${item?.piggy_label || ''}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="exclusive-type">Identificador Tipo</label>
              <input type="text" id="exclusive-type" class="form-input" placeholder="Ej: dorado, plus, premium" value="${item?.piggy_type || ''}" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="exclusive-price">Precio de Venta</label>
              <div class="currency-input-wrapper">
                <span class="currency-input-prefix">$</span>
                <input type="text" id="exclusive-price" class="form-input" placeholder="1.300.000" value="${formatCurrency(item?.price || 1300000)}" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="exclusive-roi">Bono ROI Extra (%)</label>
              <input type="number" id="exclusive-roi" class="form-input" placeholder="2" value="${bonusPercent}" step="0.5" min="0" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="exclusive-duration">Duración de la Oferta (Horas)</label>
              <input type="number" id="exclusive-duration" class="form-input" placeholder="48" value="${item?.duration_hours || 48}" step="1" min="1" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="exclusive-min-piggies">Mínimo de Piggys Requeridos</label>
              <input type="number" id="exclusive-min-piggies" class="form-input" placeholder="2" value="${item?.min_piggies || 1}" step="1" min="0" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="exclusive-enabled">Disponibilidad en la App</label>
            <select id="exclusive-enabled" class="form-select">
              <option value="true" ${item?.is_enabled !== false ? 'selected' : ''}>Habilitado (Disponible para disparar)</option>
              <option value="false" ${item?.is_enabled === false ? 'selected' : ''}>Deshabilitado (Inactivo u oculto)</option>
            </select>
          </div>
        </form>
      `,
      onInit: (modalBody) => {
        const priceInput = modalBody.querySelector('#exclusive-price');
        setupCurrencyInput(priceInput);
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Guardar Cambios' : 'Crear Piggy Exclusivo',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const root = m?.overlay || document;
            const piggy_label = root.querySelector('#exclusive-label')?.value?.trim();
            const piggy_type = root.querySelector('#exclusive-type')?.value?.trim().toLowerCase();
            const price = parseCurrency(root.querySelector('#exclusive-price')?.value);
            const roiPercent = root.querySelector('#exclusive-roi')?.value;
            const duration_hours = root.querySelector('#exclusive-duration')?.value;
            const min_piggies = root.querySelector('#exclusive-min-piggies')?.value;
            const is_enabled = root.querySelector('#exclusive-enabled')?.value === 'true';

            if (!piggy_label || !piggy_type) {
              toast.error('Ingresa el nombre y tipo del piggy');
              return;
            }

            const payload = {
              piggy_label,
              piggy_type,
              price: Number(price || 0),
              extra_roi_bonus: Number(roiPercent || 0) / 100,
              duration_hours: Number(duration_hours || 48),
              min_piggies: Number(min_piggies || 1),
              is_enabled
            };

            let res;
            if (isEdit) {
              res = await marketingService.updateExclusiveConfig(item.id, payload);
            } else {
              res = await marketingService.createExclusiveConfig(payload);
            }

            if (res.success) {
              toast.success(isEdit ? 'Configuración actualizada' : 'Piggy exclusivo creado');
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
