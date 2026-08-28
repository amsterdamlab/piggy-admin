/* ==========================================================================
   MARKETING - BONOS CONSUMO: SUB-TAB 1: CAMPAÑAS DE BONOS (marketing_bonuses)
   Lanzamiento, gestión de audiencias, vigencias y control de campañas activas
   ========================================================================== */

import { marketingService } from '../../services/marketingService.js';
import { DataTable } from '../../components/DataTable.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';
import { formatCurrency, parseCurrency, setupCurrencyInput } from '../../utils/formUtils.js';

export class MarketingBonusesTab {
  constructor(parentView) {
    this.parentView = parentView;
    this.dataTable = null;
  }

  render(data) {
    const rawData = data || [];
    const userBonuses = this.parentView.dataStore.user_marketing_bonuses || [];
    const profiles = this.parentView.profilesList || [];

    // Métricas de campañas
    const totalCampaigns = rawData.length;
    const activeCampaigns = rawData.filter(c => c.is_active && (!c.expires_at || new Date(c.expires_at) > new Date())).length;
    const totalAmountCommitted = rawData.filter(c => c.is_active).reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const totalAssignments = userBonuses.length;
    const redeemedAssignments = userBonuses.filter(ub => ub.status === 'redeemed').length;
    const globalConversionRate = totalAssignments > 0 ? Math.round((redeemedAssignments / totalAssignments) * 100) : 0;

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar campañas de bonos por nombre o audiencia...',
      actionButton: {
        text: 'Nueva Campaña de Bono',
        icon: icons.plus,
        onClick: () => this.openModal()
      },
      columns: [
        {
          header: 'Campaña / Promoción',
          sortValue: (c) => c.campaign_name,
          render: (row) => `
            <div>
              <div style="font-weight: 800; color: var(--text-primary); font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
                <span>${icons.gift}</span>
                <span>${row.campaign_name || 'Campaña sin nombre'}</span>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 3px; max-width: 320px; line-height: 1.3;">
                ${row.description || 'Sin descripción'}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 4px;">
                Creada: ${new Date(row.created_at || Date.now()).toLocaleDateString('es-CO')}
              </div>
            </div>
          `
        },
        {
          header: 'Monto del Bono',
          sortValue: (c) => Number(c.amount || 0),
          render: (row) => `
            <div>
              <div style="font-weight: 800; color: var(--accent-green); font-size: 1.15rem;">
                $${Number(row.amount || 0).toLocaleString('es-CO')}
              </div>
              <div style="font-size: 0.72rem; color: var(--accent-gold); display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                ${icons.tag} Bono de Consumo
              </div>
            </div>
          `
        },
        {
          header: 'Audiencia Objetivo',
          sortValue: (c) => c.target_audience,
          render: (row) => {
            const aud = row.target_audience || 'ALL';
            let label = 'Todos los Inversionistas';
            let badgeClass = 'badge-info';

            if (aud === 'NEW_USERS') {
              label = 'Nuevos Inversionistas';
              badgeClass = 'badge-warning';
            } else if (aud === 'ACTIVE_INVESTORS') {
              label = 'Inversionistas Activos';
              badgeClass = 'badge-success';
            } else if (aud === 'NO_PIGGIES') {
              label = 'Sin Cerditos en Engorde';
              badgeClass = 'badge-neutral';
            } else if (aud === 'CUSTOM') {
              label = 'Segmento Seleccionado';
              badgeClass = 'badge-purple';
            }

            return `
              <div>
                <span class="badge ${badgeClass}" style="font-size: 0.75rem; font-weight: 700; padding: 3px 8px;">
                  ${label}
                </span>
              </div>
            `;
          }
        },
        {
          header: 'Vigencia & Caducidad',
          sortValue: (c) => c.expires_at ? new Date(c.expires_at).getTime() : 0,
          render: (row) => {
            if (!row.expires_at) {
              return '<span class="badge badge-neutral" style="font-size: 0.72rem;">Sin vencimiento</span>';
            }
            const expDate = new Date(row.expires_at);
            const now = new Date();
            const isExpired = expDate < now;
            const diffHours = Math.round((expDate - now) / (1000 * 60 * 60));
            const diffDays = Math.ceil(diffHours / 24);

            if (isExpired) {
              return `
                <div>
                  <span class="badge badge-danger" style="font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;">
                    ${icons.alertTriangle} Expirada
                  </span>
                  <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                    Venció: ${expDate.toLocaleDateString('es-CO')}
                  </div>
                </div>
              `;
            }

            return `
              <div>
                <span class="badge badge-info" style="font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;">
                  ${icons.clock} ${diffDays > 1 ? `Quedan ${diffDays} días` : `Quedan ${diffHours}h`}
                </span>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                  Vence: ${expDate.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            `;
          }
        },
        {
          header: 'Trazabilidad',
          sortValue: (c) => {
            const count = userBonuses.filter(ub => ub.campaign_id === c.id).length;
            return count;
          },
          render: (row) => {
            const assigned = userBonuses.filter(ub => ub.campaign_id === row.id);
            const redeemed = assigned.filter(ub => ub.status === 'redeemed');
            const rate = assigned.length > 0 ? Math.round((redeemed.length / assigned.length) * 100) : 0;

            return `
              <div>
                <div style="font-weight: 700; color: var(--text-primary); font-size: 0.85rem;">
                  ${assigned.length} usuarios asignados
                </div>
                <div style="font-size: 0.72rem; color: ${rate > 0 ? 'var(--accent-green)' : 'var(--text-muted)'}; margin-top: 2px;">
                  ${redeemed.length} redimidos (${rate}% efectividad)
                </div>
              </div>
            `;
          }
        },
        {
          header: 'Estado',
          sortValue: (c) => c.is_active ? 1 : 0,
          render: (row) => {
            const isExpired = row.expires_at && new Date(row.expires_at) < new Date();
            if (isExpired) {
              return '<span class="badge badge-danger">Expirada</span>';
            }
            return row.is_active
              ? '<span class="badge badge-success">Activa</span>'
              : '<span class="badge badge-neutral">Pausada</span>';
          }
        },
        {
          header: 'Acciones',
          sortable: false,
          style: 'text-align: right;',
          render: (row) => `
            <div style="display: flex; gap: 0.35rem; justify-content: flex-end; flex-wrap: wrap;">
              <button class="btn btn-primary btn-sm" data-action="launch-assign" data-id="${row.id}" style="padding: 3px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;" title="Asignar masivamente a usuarios">
                ${icons.users} <span>Asignar</span>
              </button>
              <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${row.id}" style="padding: 3px 8px; font-size: 0.75rem;" title="Editar Campaña">
                ${icons.edit}
              </button>
              <button class="btn btn-secondary btn-sm" data-action="toggle-status" data-id="${row.id}" style="padding: 3px 8px; font-size: 0.75rem;" title="${row.is_active ? 'Pausar campaña' : 'Activar campaña'}">
                ${row.is_active ? icons.x : icons.check}
              </button>
              <button class="btn btn-danger btn-sm" data-action="delete" data-id="${row.id}" style="padding: 3px 8px; font-size: 0.75rem;" title="Eliminar campaña">
                ${icons.trash}
              </button>
            </div>
          `
        }
      ],
      data: rawData
    });

    return `
      <div>
        <!-- 4 Tarjetas de Métricas de Inteligencia de Bonos de Consumo -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
          
          <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-green);">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
              <span>Campañas de Bonos</span>
              <span style="color: var(--accent-green);">${icons.gift}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-green); margin-top: 0.3rem;">
              ${activeCampaigns} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">/ ${totalCampaigns} total</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              Campañas activas en tiempo real
            </div>
          </div>

          <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-gold);">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
              <span>Monto Unitario Activo</span>
              <span style="color: var(--accent-gold);">${icons.dollar}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-gold); margin-top: 0.3rem;">
              $${totalAmountCommitted.toLocaleString('es-CO')}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              Suma de incentivos en oferta
            </div>
          </div>

          <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-blue);">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
              <span>Usuarios Asignados</span>
              <span style="color: var(--accent-blue);">${icons.users}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-blue); margin-top: 0.3rem;">
              ${totalAssignments}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              Inversionistas con bonos asignados
            </div>
          </div>

          <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-purple);">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
              <span>Efectividad de Canje</span>
              <span style="color: var(--accent-purple);">${icons.award}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-purple); margin-top: 0.3rem;">
              ${globalConversionRate}%
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              ${redeemedAssignments} de ${totalAssignments} bonos redimidos
            </div>
          </div>

        </div>

        <!-- Tabla interactiva -->
        <div id="marketing-bonuses-datatable">
          ${this.dataTable.render()}
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    if (this.dataTable) {
      const dtContainer = container.querySelector('#marketing-bonuses-datatable');
      if (dtContainer) this.dataTable.attachEvents(dtContainer);
    }

    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        this.handleAction(action, id);
      });
    });
  }

  async handleAction(action, id) {
    const rawData = this.parentView.dataStore.marketing_bonuses || [];
    const item = rawData.find(c => c.id === id);

    if (action === 'edit' && item) {
      this.openModal(item);
    } else if (action === 'toggle-status' && item) {
      const newStatus = !item.is_active;
      const res = await marketingService.toggleMarketingBonusStatus(id, newStatus);
      if (res.success) {
        toast.success(`Campaña ${newStatus ? 'activada' : 'pausada'} con éxito`);
        item.is_active = newStatus;
        this.parentView.updateView();
      } else {
        toast.error('Error al actualizar estado: ' + res.error);
      }
    } else if (action === 'delete' && item) {
      if (confirm(`¿Eliminar la campaña "${item.campaign_name}"? Esta acción no se puede deshacer.`)) {
        const res = await marketingService.deleteMarketingBonus(id);
        if (res.success) {
          toast.success('Campaña eliminada correctamente');
          this.parentView.dataStore.marketing_bonuses = this.parentView.dataStore.marketing_bonuses.filter(c => c.id !== id);
          this.parentView.dataStore.user_marketing_bonuses = this.parentView.dataStore.user_marketing_bonuses.filter(ub => ub.campaign_id !== id);
          this.parentView.updateView();
        } else {
          toast.error('Error al eliminar: ' + res.error);
        }
      }
    } else if (action === 'launch-assign' && item) {
      this.openAssignModal(item);
    }
  }

  openModal(item = null) {
    const isEdit = !!item;
    const profiles = this.parentView.profilesList || [];

    modal.open({
      title: isEdit ? 'Editar Campaña de Bonos de Consumo' : 'Lanzar Nueva Campaña de Bonos de Consumo',
      size: 'medium',
      contentHtml: `
        <form id="form-marketing-bonus" style="display: flex; flex-direction: column; gap: 1rem;">
          
          <div style="background: rgba(0, 209, 178, 0.08); border: 1px solid var(--accent-green); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--text-primary);">
            <strong style="color: var(--accent-green);">${icons.gift} Campañas de Bonos de Consumo:</strong> Configura ofertas atractivas con vigencia controlada para compras de carne y productos de la granja.
          </div>

          <div class="form-group">
            <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
              Nombre de la Campaña: *
            </label>
            <input type="text" id="mb-name" class="form-control" placeholder="Ej: Bono Fidelización Granja / Fin de Semana Lechón" value="${item ? (item.campaign_name || '') : ''}" required style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Monto del Bono: *
              </label>
              <input type="text" id="mb-amount" class="form-control" placeholder="$50.000" value="${item ? formatCurrency(item.amount) : '$50.000'}" required style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--accent-green); font-weight: 800; border: 1px solid var(--border-color); border-radius: var(--radius-sm);" />
            </div>

            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Audiencia Objetivo: *
              </label>
              <select id="mb-audience" class="form-control" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                <option value="ALL" ${!item || item.target_audience === 'ALL' ? 'selected' : ''}>Todos los Inversionistas (${profiles.length})</option>
                <option value="ACTIVE_INVESTORS" ${item && item.target_audience === 'ACTIVE_INVESTORS' ? 'selected' : ''}>Inversionistas con Cerditos Activos</option>
                <option value="NEW_USERS" ${item && item.target_audience === 'NEW_USERS' ? 'selected' : ''}>Nuevos Usuarios Registrados</option>
                <option value="NO_PIGGIES" ${item && item.target_audience === 'NO_PIGGIES' ? 'selected' : ''}>Usuarios sin Cerditos Activos</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
              Descripción / Mensaje Promocional: *
            </label>
            <textarea id="mb-description" class="form-control" rows="2" placeholder="Ej: Disfruta $50.000 de regalo para tu próxima compra de cortes selectos en la Tienda Piggy..." required style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); resize: vertical;">${item ? (item.description || '') : ''}</textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Fecha de Expiración (Opcional):
              </label>
              <input type="datetime-local" id="mb-expires" class="form-control" value="${item && item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : ''}" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);" />
            </div>

            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Estado Inicial:
              </label>
              <select id="mb-active" class="form-control" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                <option value="true" ${!item || item.is_active ? 'selected' : ''}>Activa (Lanzar inmediatamente)</option>
                <option value="false" ${item && !item.is_active ? 'selected' : ''}>Pausada / Borrador</option>
              </select>
            </div>
          </div>

          ${!isEdit ? `
            <div style="background: rgba(255, 184, 0, 0.08); border: 1px solid var(--accent-gold); padding: 0.75rem; border-radius: var(--radius-sm); margin-top: 0.5rem;">
              <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer; font-size: 0.85rem; color: var(--text-primary);">
                <input type="checkbox" id="mb-auto-assign" checked style="accent-color: var(--accent-gold); margin-top: 3px;" />
                <div>
                  <strong>🚀 Asignar automáticamente a la audiencia ahora mismo</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                    Crea los registros de seguimiento en tiempo real en la tabla <code>user_marketing_bonuses</code> para los usuarios de la audiencia seleccionada.
                  </div>
                </div>
              </label>
            </div>
          ` : ''}

        </form>
      `,
      onInit: (modalBody) => {
        const amtInput = modalBody.querySelector('#mb-amount');
        if (amtInput) setupCurrencyInput(amtInput);
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Guardar Cambios' : 'Lanzar Campaña',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const name = document.getElementById('mb-name').value.trim();
            const amount = parseCurrency(document.getElementById('mb-amount').value);
            const description = document.getElementById('mb-description').value.trim();
            const targetAudience = document.getElementById('mb-audience').value;
            const expiresInput = document.getElementById('mb-expires').value;
            const isActive = document.getElementById('mb-active').value === 'true';
            const autoAssign = document.getElementById('mb-auto-assign')?.checked;

            if (!name) {
              toast.error('Por favor ingresa el nombre de la campaña');
              return;
            }

            if (amount <= 0) {
              toast.error('Por favor ingresa un monto válido mayor a $0');
              return;
            }

            if (!description) {
              toast.error('Por favor ingresa una descripción');
              return;
            }

            const payload = {
              campaign_name: name,
              amount,
              description,
              target_audience: targetAudience,
              expires_at: expiresInput ? new Date(expiresInput).toISOString() : null,
              is_active: isActive
            };

            const btn = e.target;
            btn.disabled = true;
            btn.textContent = 'Procesando...';

            if (isEdit) {
              const res = await marketingService.updateMarketingBonus(item.id, payload);
              if (res.success) {
                toast.success('¡Campaña actualizada exitosamente!');
                m.close();
                await this.refreshData();
              } else {
                toast.error('Error al actualizar: ' + res.error);
                btn.disabled = false;
                btn.textContent = 'Guardar Cambios';
              }
            } else {
              let targetUserIds = [];
              if (autoAssign) {
                if (targetAudience === 'ALL') {
                  targetUserIds = profiles.map(p => p.id);
                } else if (targetAudience === 'ACTIVE_INVESTORS') {
                  targetUserIds = profiles.filter(p => (p.activePiggiesCount || 0) > 0).map(p => p.id);
                } else if (targetAudience === 'NO_PIGGIES') {
                  targetUserIds = profiles.filter(p => (p.activePiggiesCount || 0) === 0).map(p => p.id);
                } else {
                  targetUserIds = profiles.map(p => p.id);
                }
              }

              const res = await marketingService.launchCampaignWithAssignments({
                campaign: payload,
                userIds: targetUserIds
              });

              if (res.success) {
                toast.success(`¡Campaña lanzada con éxito${res.assignedCount > 0 ? ` y asignada a ${res.assignedCount} usuarios` : ''}!`);
                m.close();
                await this.refreshData();
              } else {
                toast.error('Error al lanzar campaña: ' + res.error);
                btn.disabled = false;
                btn.textContent = 'Lanzar Campaña';
              }
            }
          }
        }
      ]
    });
  }

  openAssignModal(campaign) {
    const profiles = this.parentView.profilesList || [];

    modal.open({
      title: `Asignar Campaña: ${campaign.campaign_name}`,
      size: 'medium',
      contentHtml: `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: var(--bg-dark); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.85rem;">
            <div>Campaña: <strong>${campaign.campaign_name}</strong></div>
            <div style="color: var(--accent-green); font-weight: 700; margin-top: 3px;">Monto: $${Number(campaign.amount || 0).toLocaleString('es-CO')}</div>
            <div style="color: var(--text-muted); font-size: 0.78rem; margin-top: 2px;">Vence: ${campaign.expires_at ? new Date(campaign.expires_at).toLocaleString('es-CO') : 'Sin fecha de vencimiento'}</div>
          </div>

          <div class="form-group">
            <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; display: block;">
              Alcance de la Asignación:
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <label style="display: flex; align-items: center; gap: 8px; padding: 0.6rem 0.8rem; background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.85rem;">
                <input type="radio" name="as-mode" value="all" checked style="accent-color: var(--accent-gold);" />
                <span>${icons.gift} Todos (${profiles.length} inversionistas)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 8px; padding: 0.6rem 0.8rem; background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.85rem;">
                <input type="radio" name="as-mode" value="single" style="accent-color: var(--accent-green);" />
                <span>${icons.users} Usuario Individual</span>
              </label>
            </div>
          </div>

          <div class="form-group" id="as-single-user-cont" style="display: none;">
            <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
              Seleccionar Inversionista:
            </label>
            <select id="as-user-id" class="form-control" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
              <option value="" disabled selected>-- Elige un usuario --</option>
              ${profiles.map(p => `
                <option value="${p.id}">${p.fullName || p.full_name || 'Sin Nombre'} (${p.email || p.whatsapp || p.id.slice(0, 6)})</option>
              `).join('')}
            </select>
          </div>
        </div>
      `,
      onInit: (modalBody) => {
        const radios = modalBody.querySelectorAll('input[name="as-mode"]');
        const singleCont = modalBody.querySelector('#as-single-user-cont');
        radios.forEach(r => {
          r.addEventListener('change', () => {
            singleCont.style.display = r.value === 'single' ? 'block' : 'none';
          });
        });
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: 'Confirmar Asignación',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const isAll = document.querySelector('input[name="as-mode"]:checked').value === 'all';
            let targetIds = [];

            if (isAll) {
              targetIds = profiles.map(p => p.id);
            } else {
              const uid = document.getElementById('as-user-id').value;
              if (!uid) {
                toast.error('Por favor selecciona un usuario');
                return;
              }
              targetIds = [uid];
            }

            const now = new Date().toISOString();
            const assignments = targetIds.map(uid => ({
              campaign_id: campaign.id,
              user_id: uid,
              amount: Number(campaign.amount || 0),
              status: 'active',
              granted_at: now,
              expires_at: campaign.expires_at || null
            }));

            const btn = e.target;
            btn.disabled = true;
            btn.textContent = 'Asignando...';

            const res = await marketingService.createUserMarketingBonusesBatch(assignments);
            if (res.success) {
              toast.success(`¡Bono asignado con éxito a ${assignments.length} usuario(s)!`);
              m.close();
              await this.refreshData();
            } else {
              toast.error('Error al asignar: ' + res.error);
              btn.disabled = false;
              btn.textContent = 'Confirmar Asignación';
            }
          }
        }
      ]
    });
  }

  async refreshData() {
    const [bonuses, userBonuses] = await Promise.all([
      marketingService.getMarketingBonuses(),
      marketingService.getUserMarketingBonuses()
    ]);
    this.parentView.dataStore.marketing_bonuses = bonuses;
    this.parentView.dataStore.user_marketing_bonuses = userBonuses;
    this.parentView.updateView();
    this.parentView.updateBadges();
  }
}
