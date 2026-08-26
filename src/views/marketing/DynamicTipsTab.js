/* ==========================================================================
   MARKETING - TAB 4: CONSEJOS & TIPS DINÁMICOS (dynamic_tips)
   ========================================================================== */

import { marketingService } from '../../services/marketingService.js';
import { DataTable } from '../../components/DataTable.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';

export class DynamicTipsTab {
  constructor(parentView) {
    this.parentView = parentView;
    this.dataTable = null;
  }

  render(data) {
    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar tips y consejos...',
      actionButton: {
        text: 'Nuevo Tip Dinámico',
        icon: icons.plus,
        onClick: () => this.openModal()
      },
      columns: [
        {
          header: 'Consejo / Título',
          render: (row) => `
            <div style="font-weight: 700; color: var(--text-primary); max-width: 320px;">
              ${row.title || 'Consejo financiero'}
            </div>
          `
        },
        {
          header: 'Prioridad',
          render: (row) => `<span class="badge badge-neutral">Nivel ${row.priority ?? 1}</span>`
        },
        {
          header: 'Color / Icono',
          render: (row) => `
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              <span style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: ${row.color || '#F770B4'}; border: 1px solid var(--border-color);"></span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${row.icon || 'lightbulb'}</span>
            </div>
          `
        },
        {
          header: 'Recompensa',
          render: (row) => row.reward > 0 ? `
            <span style="font-weight: 800; color: var(--accent-gold); font-size: 0.85rem;">
              $${Number(row.reward).toLocaleString('es-CO')}
            </span>
          ` : '<span style="color: var(--text-muted); font-size: 0.75rem;">Sin premio</span>'
        },
        {
          header: 'Estado',
          render: (row) => `
            <span class="badge ${row.is_active ? 'badge-success' : 'badge-neutral'}">
              ${row.is_active ? 'Activo' : 'Pausado'}
            </span>
          `
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
      marketingService.toggleDynamicTipStatus(row.id, newStatus).then(res => {
        if (res.success) {
          row.is_active = newStatus;
          toast.success(newStatus ? 'Tip activado' : 'Tip pausado');
          this.dataTable.setData(this.parentView.dataStore.dynamic_tips);
        } else {
          toast.error(res.error || 'Error al cambiar estado');
        }
      });
    } else if (action === 'edit') {
      this.openModal(row);
    } else if (action === 'delete') {
      if (confirm('¿Eliminar este consejo dinámico?')) {
        marketingService.deleteDynamicTip(row.id).then(res => {
          if (res.success) {
            toast.success('Tip eliminado');
            this.parentView.dataStore.dynamic_tips = this.parentView.dataStore.dynamic_tips.filter(item => item.id !== row.id);
            this.dataTable.setData(this.parentView.dataStore.dynamic_tips);
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
      title: isEdit ? 'Editar Tip Dinámico' : 'Nuevo Tip Dinámico',
      contentHtml: `
        <form id="tip-form">
          <div class="form-group">
            <label class="form-label" for="tip-title">Texto del Consejo / Tip</label>
            <textarea id="tip-title" class="form-textarea" placeholder="Ej: ¿Sabías que alimentar a tu cerdito todos los días aumenta tus ganancias?" required>${item?.title || ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="tip-priority">Prioridad de Aparición</label>
              <input type="number" id="tip-priority" class="form-input" value="${item?.priority ?? 1}" min="1" max="10" />
            </div>

            <div class="form-group">
              <label class="form-label" for="tip-reward">Recompensa Opcional ($)</label>
              <input type="number" id="tip-reward" class="form-input" value="${item?.reward || 0}" step="500" min="0" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="tip-icon">Icono</label>
              <input type="text" id="tip-icon" class="form-input" value="${item?.icon || 'lightbulb'}" placeholder="lightbulb, zap, pig..." />
            </div>

            <div class="form-group">
              <label class="form-label" for="tip-color">Color Hex</label>
              <input type="text" id="tip-color" class="form-input" value="${item?.color || '#F770B4'}" placeholder="#F770B4" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="tip-cta">CTA URL / Enlace (Opcional)</label>
              <input type="text" id="tip-cta" class="form-input" value="${item?.cta_url || ''}" placeholder="/piggies o https://..." />
            </div>

            <div class="form-group">
              <label class="form-label" for="tip-active">Estado</label>
              <select id="tip-active" class="form-select">
                <option value="true" ${item?.is_active !== false ? 'selected' : ''}>Activo (En rotación)</option>
                <option value="false" ${item?.is_active === false ? 'selected' : ''}>Pausado</option>
              </select>
            </div>
          </div>
        </form>
      `,
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Guardar Cambios' : 'Crear Tip',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const title = document.querySelector('#tip-title').value.trim();
            const priority = document.querySelector('#tip-priority').value;
            const reward = document.querySelector('#tip-reward').value;
            const icon = document.querySelector('#tip-icon').value.trim();
            const color = document.querySelector('#tip-color').value.trim();
            const cta_url = document.querySelector('#tip-cta').value.trim();
            const is_active = document.querySelector('#tip-active').value === 'true';

            if (!title) {
              toast.error('Ingresa el texto del consejo');
              return;
            }

            const payload = {
              title,
              priority: Number(priority),
              reward: Number(reward),
              icon,
              color: color || '#F770B4',
              cta_url,
              is_active
            };

            let res;
            if (isEdit) {
              res = await marketingService.updateDynamicTip(item.id, payload);
            } else {
              res = await marketingService.createDynamicTip(payload);
            }

            if (res.success) {
              toast.success(isEdit ? 'Tip actualizado' : 'Tip dinámico creado');
              this.parentView.dataStore.dynamic_tips = await marketingService.getDynamicTips();
              this.dataTable.setData(this.parentView.dataStore.dynamic_tips);
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
