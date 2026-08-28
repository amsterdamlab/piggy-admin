/* ==========================================================================
   MARKETING - BONOS CONSUMO: SUB-TAB 1: CAMPAÑAS ACTIVAS
   Control centralizado de campañas agrupadas a partir de user_marketing_bonuses
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
    const rawUserBonuses = this.parentView.dataStore.user_marketing_bonuses || [];
    const profiles = this.parentView.profilesList || [];
    const now = new Date();

    // 1. Agrupar registros de user_marketing_bonuses por nombre de campaña
    const campaignsMap = {};
    rawUserBonuses.forEach(ub => {
      const campName = (ub.campaign_name || 'Bono de Consumo General').trim();
      if (!campaignsMap[campName]) {
        campaignsMap[campName] = {
          campaign_name: campName,
          amount: Number(ub.amount || 0),
          created_at: ub.created_at,
          expires_at: ub.expires_at,
          is_active: ub.is_active !== undefined ? ub.is_active : true,
          records: []
        };
      }
      campaignsMap[campName].records.push(ub);
      // Mantener la fecha de vencimiento más representativa
      if (ub.expires_at && !campaignsMap[campName].expires_at) {
        campaignsMap[campName].expires_at = ub.expires_at;
      }
      // Mantener el monto más alto si varía
      if (Number(ub.amount || 0) > campaignsMap[campName].amount) {
        campaignsMap[campName].amount = Number(ub.amount || 0);
      }
      // Mantener estado activo si al menos un registro está activo
      if (ub.is_active) {
        campaignsMap[campName].is_active = true;
      }
    });

    const campaignsList = Object.values(campaignsMap).map(c => {
      const totalUsers = c.records.length;
      const totalVolume = c.records.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const redeemed = c.records.filter(r => r.status === 'redeemed');
      const active = c.records.filter(r => r.status === 'active' && (!r.expires_at || new Date(r.expires_at) >= now));
      const expired = c.records.filter(r => r.status !== 'redeemed' && r.expires_at && new Date(r.expires_at) < now);
      const conversionRate = totalUsers > 0 ? Math.round((redeemed.length / totalUsers) * 100) : 0;

      return {
        ...c,
        totalUsers,
        totalVolume,
        redeemedCount: redeemed.length,
        activeCount: active.length,
        expiredCount: expired.length,
        conversionRate
      };
    });

    // 2. Métricas globales del panel
    const totalCampaigns = campaignsList.length;
    const activeCampaigns = campaignsList.filter(c => c.is_active && (!c.expires_at || new Date(c.expires_at) >= now)).length;
    const totalImpactedUsers = rawUserBonuses.length;
    const totalDistributedVolume = rawUserBonuses.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const totalRedeemedGlobal = rawUserBonuses.filter(r => r.status === 'redeemed').length;
    const globalConversionRate = totalImpactedUsers > 0 ? Math.round((totalRedeemedGlobal / totalImpactedUsers) * 100) : 0;

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar campañas de bonos por nombre...',
      actionButton: {
        text: 'Lanzar Nueva Campaña',
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
                <span>${row.campaign_name}</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 3px;">
                Lanzada: ${row.created_at ? new Date(row.created_at).toLocaleDateString('es-CO') : 'Reciente'}
              </div>
            </div>
          `
        },
        {
          header: 'Monto del Bono',
          sortValue: (c) => c.amount,
          render: (row) => `
            <div>
              <div style="font-weight: 800; color: var(--accent-green); font-size: 1.15rem;">
                $${Number(row.amount || 0).toLocaleString('es-CO')}
              </div>
              <span class="badge badge-neutral" style="font-size: 0.7rem; margin-top: 2px;">
                Bono Consumo
              </span>
            </div>
          `
        },
        {
          header: 'Alcance / Inversionistas',
          sortValue: (c) => c.totalUsers,
          render: (row) => `
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem; display: flex; align-items: center; gap: 5px;">
                <span>${icons.users}</span>
                <span>${row.totalUsers} usuarios</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--accent-gold); margin-top: 2px;">
                Volumen: $${row.totalVolume.toLocaleString('es-CO')}
              </div>
            </div>
          `
        },
        {
          header: 'Vigencia & Caducidad',
          sortValue: (c) => c.expires_at ? new Date(c.expires_at).getTime() : 0,
          render: (row) => {
            if (!row.expires_at) {
              return '<span class="badge badge-neutral" style="font-size: 0.72rem;">Sin vencimiento</span>';
            }
            const expDate = new Date(row.expires_at);
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
          header: 'Trazabilidad & Efectividad',
          sortValue: (c) => c.conversionRate,
          render: (row) => `
            <div>
              <div style="font-weight: 700; color: ${row.conversionRate > 0 ? 'var(--accent-green)' : 'var(--text-primary)'}; font-size: 0.88rem;">
                ${row.redeemedCount} redimidos (${row.conversionRate}% éxito)
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                ${row.activeCount} disponibles / ${row.expiredCount} expirados
              </div>
            </div>
          `
        },
        {
          header: 'Estado',
          sortValue: (c) => c.is_active ? 1 : 0,
          render: (row) => {
            const isExpired = row.expires_at && new Date(row.expires_at) < now;
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
              <button class="btn btn-primary btn-sm" data-action="assign-more" data-campaign="${encodeURIComponent(row.campaign_name)}" data-amount="${row.amount}" data-expires="${row.expires_at || ''}" style="padding: 3px 8px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;" title="Asignar a más usuarios">
                ${icons.users} <span>Asignar</span>
              </button>
              <button class="btn btn-secondary btn-sm" data-action="toggle-campaign" data-campaign="${encodeURIComponent(row.campaign_name)}" data-active="${row.is_active}" style="padding: 3px 8px; font-size: 0.75rem;" title="${row.is_active ? 'Pausar campaña' : 'Activar campaña'}">
                ${row.is_active ? icons.x : icons.check}
              </button>
              <button class="btn btn-danger btn-sm" data-action="delete-campaign" data-campaign="${encodeURIComponent(row.campaign_name)}" style="padding: 3px 8px; font-size: 0.75rem;" title="Eliminar todos los bonos de esta campaña">
                ${icons.trash}
              </button>
            </div>
          `
        }
      ],
      data: campaignsList
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
              <span>Volumen Distribuido</span>
              <span style="color: var(--accent-gold);">${icons.dollar}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-gold); margin-top: 0.3rem;">
              $${totalDistributedVolume.toLocaleString('es-CO')}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              Suma de bonos asignados
            </div>
          </div>

          <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-blue);">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
              <span>Usuarios Impactados</span>
              <span style="color: var(--accent-blue);">${icons.users}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-blue); margin-top: 0.3rem;">
              ${totalImpactedUsers}
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
              ${totalRedeemedGlobal} de ${totalImpactedUsers} bonos canjeados
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
        const campaignName = decodeURIComponent(btn.getAttribute('data-campaign') || '');
        const amount = btn.getAttribute('data-amount');
        const expires = btn.getAttribute('data-expires');
        const isActive = btn.getAttribute('data-active') === 'true';

        this.handleAction(action, { campaignName, amount, expires, isActive });
      });
    });
  }

  async handleAction(action, { campaignName, amount, expires, isActive }) {
    if (action === 'toggle-campaign' && campaignName) {
      const newStatus = !isActive;
      const res = await marketingService.toggleCampaignBatchStatus(campaignName, newStatus);
      if (res.success) {
        toast.success(`Campaña "${campaignName}" ${newStatus ? 'activada' : 'pausada'}`);
        await this.refreshData();
      } else {
        toast.error('Error al actualizar estado: ' + res.error);
      }
    } else if (action === 'delete-campaign' && campaignName) {
      if (confirm(`¿Eliminar todos los bonos vinculados a la campaña "${campaignName}"?`)) {
        const res = await marketingService.deleteCampaignBatch(campaignName);
        if (res.success) {
          toast.success('Campaña eliminada correctamente');
          await this.refreshData();
        } else {
          toast.error('Error al eliminar: ' + res.error);
        }
      }
    } else if (action === 'assign-more' && campaignName) {
      this.openAssignMoreModal({ campaignName, amount, expires });
    }
  }

  openModal() {
    const profiles = this.parentView.profilesList || [];

    modal.open({
      title: 'Lanzar Nueva Campaña de Bonos de Consumo',
      size: 'medium',
      contentHtml: `
        <form id="form-launch-bonus-campaign" style="display: flex; flex-direction: column; gap: 1rem;">
          
          <div style="background: rgba(0, 209, 178, 0.08); border: 1px solid var(--accent-green); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--text-primary);">
            <strong style="color: var(--accent-green);">${icons.gift} Bonos de Consumo en Tiempo Real:</strong> Configura y lanza campañas asignadas directamente a los inversionistas para compras en la granja y tienda Piggy.
          </div>

          <div class="form-group">
            <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
              Nombre de la Campaña: *
            </label>
            <input type="text" id="lbc-name" class="form-control" placeholder="Ej: Fin de Semana Lechón / Bono Fidelización Cortes Selectos" required style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Monto del Bono por Usuario: *
              </label>
              <input type="text" id="lbc-amount" class="form-control" placeholder="$50.000" value="$50.000" required style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--accent-green); font-weight: 800; border: 1px solid var(--border-color); border-radius: var(--radius-sm);" />
            </div>

            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Audiencia Objetivo: *
              </label>
              <select id="lbc-audience" class="form-control" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                <option value="ALL">Todos los Inversionistas (${profiles.length})</option>
                <option value="ACTIVE_INVESTORS">Inversionistas con Cerditos Activos</option>
                <option value="NEW_USERS">Nuevos Usuarios Registrados</option>
                <option value="NO_PIGGIES">Usuarios sin Cerditos Activos</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Fecha de Expiración (Opcional):
              </label>
              <input type="datetime-local" id="lbc-expires" class="form-control" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);" />
            </div>

            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Estado Inicial:
              </label>
              <select id="lbc-active" class="form-control" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                <option value="true" selected>Activa (Asignar y habilitar inmediatamente)</option>
                <option value="false">Pausada (Crear en estado inactivo)</option>
              </select>
            </div>
          </div>

        </form>
      `,
      onInit: (modalBody) => {
        const amtInput = modalBody.querySelector('#lbc-amount');
        if (amtInput) setupCurrencyInput(amtInput);
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: 'Lanzar Campaña',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const name = document.getElementById('lbc-name').value.trim();
            const amount = parseCurrency(document.getElementById('lbc-amount').value);
            const audience = document.getElementById('lbc-audience').value;
            const expiresInput = document.getElementById('lbc-expires').value;
            const isActive = document.getElementById('lbc-active').value === 'true';

            if (!name) {
              toast.error('Por favor ingresa el nombre de la campaña');
              return;
            }

            if (amount <= 0) {
              toast.error('Por favor ingresa un monto válido mayor a $0');
              return;
            }

            let targetUserIds = [];
            if (audience === 'ALL') {
              targetUserIds = profiles.map(p => p.id);
            } else if (audience === 'ACTIVE_INVESTORS') {
              targetUserIds = profiles.filter(p => (p.activePiggiesCount || 0) > 0).map(p => p.id);
            } else if (audience === 'NO_PIGGIES') {
              targetUserIds = profiles.filter(p => (p.activePiggiesCount || 0) === 0).map(p => p.id);
            } else {
              targetUserIds = profiles.map(p => p.id);
            }

            if (targetUserIds.length === 0) {
              toast.error('No se encontraron usuarios en la audiencia seleccionada');
              return;
            }

            const btn = e.target;
            btn.disabled = true;
            btn.textContent = 'Lanzando...';

            const res = await marketingService.launchCampaign({
              campaign_name: name,
              amount,
              expires_at: expiresInput ? new Date(expiresInput).toISOString() : null,
              is_active: isActive,
              userIds: targetUserIds
            });

            if (res.success) {
              toast.success(`¡Campaña lanzada con éxito a ${res.count || targetUserIds.length} inversionista(s)!`);
              m.close();
              await this.refreshData();
            } else {
              toast.error('Error al lanzar campaña: ' + res.error);
              btn.disabled = false;
              btn.textContent = 'Lanzar Campaña';
            }
          }
        }
      ]
    });
  }

  openAssignMoreModal({ campaignName, amount, expires }) {
    const profiles = this.parentView.profilesList || [];

    modal.open({
      title: `Asignar Campaña: ${campaignName}`,
      size: 'medium',
      contentHtml: `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: var(--bg-dark); padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); font-size: 0.85rem;">
            <div>Campaña: <strong>${campaignName}</strong></div>
            <div style="color: var(--accent-green); font-weight: 700; margin-top: 3px;">Monto: $${Number(amount || 0).toLocaleString('es-CO')}</div>
            <div style="color: var(--text-muted); font-size: 0.78rem; margin-top: 2px;">Vence: ${expires ? new Date(expires).toLocaleString('es-CO') : 'Sin fecha de vencimiento'}</div>
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

            const items = targetIds.map(uid => ({
              campaign_name: campaignName,
              user_id: uid,
              amount: Number(amount || 0),
              status: 'active',
              is_active: true,
              expires_at: expires || null
            }));

            const btn = e.target;
            btn.disabled = true;
            btn.textContent = 'Asignando...';

            const res = await marketingService.createUserMarketingBonusesBatch(items);
            if (res.success) {
              toast.success(`¡Bono asignado con éxito a ${items.length} usuario(s)!`);
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
    const userBonuses = await marketingService.getUserMarketingBonuses();
    this.parentView.dataStore.user_marketing_bonuses = userBonuses;
    this.parentView.updateView();
    this.parentView.updateBadges();
  }
}
