/* ==========================================================================
   MARKETING - BONOS CONSUMO: SUB-TAB 2: SEGUIMIENTO USUARIOS
   Trazabilidad en tiempo real, estados de canje, ofertas expiradas y efectividad
   ========================================================================== */

import { marketingService } from '../../services/marketingService.js';
import { DataTable } from '../../components/DataTable.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';
import { formatCurrency, parseCurrency, setupCurrencyInput } from '../../utils/formUtils.js';

export class UserMarketingBonusesTab {
  constructor(parentView) {
    this.parentView = parentView;
    this.dataTable = null;
  }

  render(data) {
    const rawData = data || [];
    const profiles = this.parentView.profilesList || [];

    const profileMap = {};
    profiles.forEach(p => { profileMap[p.id] = p; });

    const now = new Date();

    // 1. Métricas de Inteligencia de Negocio y Trazabilidad
    const totalAssignments = rawData.length;
    const totalGrantedVolume = rawData.reduce((sum, ub) => sum + Number(ub.amount || 0), 0);

    const redeemedBonuses = rawData.filter(ub => ub.status === 'redeemed');
    const redeemedCount = redeemedBonuses.length;
    const redeemedVolume = redeemedBonuses.reduce((sum, ub) => sum + Number(ub.amount || 0), 0);

    const expiredBonuses = rawData.filter(ub => ub.status !== 'redeemed' && ub.expires_at && new Date(ub.expires_at) < now);
    const expiredCount = expiredBonuses.length;

    const activeBonuses = rawData.filter(ub => ub.is_active && ub.status === 'active' && (!ub.expires_at || new Date(ub.expires_at) >= now));
    const activeCount = activeBonuses.length;
    const activeVolume = activeBonuses.reduce((sum, ub) => sum + Number(ub.amount || 0), 0);

    const conversionRate = totalAssignments > 0 ? Math.round((redeemedCount / totalAssignments) * 100) : 0;

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar por usuario, email, campaña o estado...',
      filters: [
        { label: 'Activos / Disponibles', value: 'active' },
        { label: 'Redimidos / Canjeados', value: 'redeemed' },
        { label: 'Expirados / Vencidos', value: 'expired' },
        { label: 'Pausados', value: 'paused' }
      ],
      actionButton: {
        text: 'Asignar Bono a Usuario',
        icon: icons.plus,
        onClick: () => this.openAssignModal()
      },
      columns: [
        {
          header: 'Usuario / Inversionista',
          sortValue: (row) => {
            const p = profileMap[row.user_id] || {};
            return p.fullName || p.full_name || row.user_id;
          },
          render: (row) => {
            const p = profileMap[row.user_id] || {};
            const name = p.fullName || p.full_name || p.name || `Usuario ${row.user_id ? row.user_id.slice(0, 8) : 'N/A'}`;
            const email = p.email || (row.user_id ? `ID: ${row.user_id.slice(0, 8)}...` : '');
            const phone = p.whatsapp || p.phone || '';

            return `
              <div>
                <div style="font-weight: 800; color: var(--text-primary); font-size: 0.95rem;">
                  ${name}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
                  ${phone ? `<span style="color: var(--accent-green); margin-right: 6px;">${icons.phone} ${phone}</span>` : ''}
                  <span>${email}</span>
                </div>
                <div style="font-size: 0.72rem; color: var(--accent-gold); margin-top: 3px; display: flex; align-items: center; gap: 4px;">
                  ${icons.wallet} Saldo Bonos: $${Number(p.bonosConsumo || p.consumption_balance || 0).toLocaleString('es-CO')}
                </div>
              </div>
            `;
          }
        },
        {
          header: 'Campaña de Origen',
          sortValue: (row) => row.campaign_name || '',
          render: (row) => `
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem; display: flex; align-items: center; gap: 5px;">
                <span>${icons.gift}</span>
                <span>${row.campaign_name || 'Bono de Consumo'}</span>
              </div>
              <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px;">
                ID: ${row.id ? row.id.slice(0, 8) : 'N/A'}
              </div>
            </div>
          `
        },
        {
          header: 'Monto Asignado',
          sortValue: (row) => Number(row.amount || 0),
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
          header: 'Estado en Tiempo Real',
          sortValue: (row) => {
            if (row.status === 'redeemed') return 3;
            if (row.expires_at && new Date(row.expires_at) < now) return 0;
            if (row.is_active && row.status === 'active') return 2;
            return 1;
          },
          render: (row) => {
            const isExpired = row.status !== 'redeemed' && row.expires_at && new Date(row.expires_at) < now;

            if (row.status === 'redeemed') {
              return `
                <div>
                  <span class="badge badge-success" style="font-size: 0.75rem; padding: 3px 8px; display: inline-flex; align-items: center; gap: 4px;">
                    ${icons.check} Redimido / Canjeado
                  </span>
                  <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px;">
                    Canjeado en tienda
                  </div>
                </div>
              `;
            }

            if (isExpired) {
              return `
                <div>
                  <span class="badge badge-danger" style="font-size: 0.75rem; padding: 3px 8px; display: inline-flex; align-items: center; gap: 4px;">
                    ${icons.alertTriangle} Oferta Expirada
                  </span>
                  <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px;">
                    No canjeado a tiempo
                  </div>
                </div>
              `;
            }

            if (!row.is_active) {
              return `
                <div>
                  <span class="badge badge-neutral" style="font-size: 0.75rem; padding: 3px 8px;">
                    Pausado
                  </span>
                </div>
              `;
            }

            if (row.status === 'active') {
              const expDate = row.expires_at ? new Date(row.expires_at) : null;
              let timeLabel = 'Sin caducidad';
              if (expDate) {
                const diffHours = Math.round((expDate - now) / (1000 * 60 * 60));
                const diffDays = Math.ceil(diffHours / 24);
                timeLabel = diffDays > 1 ? `Quedan ${diffDays} días` : `Quedan ${diffHours} horas`;
              }

              return `
                <div>
                  <span class="badge badge-info" style="font-size: 0.75rem; padding: 3px 8px; display: inline-flex; align-items: center; gap: 4px;">
                    ${icons.clock} Disponible / Activo
                  </span>
                  <div style="font-size: 0.72rem; color: var(--accent-gold); margin-top: 3px; font-weight: 600;">
                    ${timeLabel}
                  </div>
                </div>
              `;
            }

            return `
              <div>
                <span class="badge badge-neutral" style="font-size: 0.75rem; padding: 3px 8px;">
                  ${row.status || 'Inactivo'}
                </span>
              </div>
            `;
          }
        },
        {
          header: 'Trazabilidad & Fechas',
          sortValue: (row) => new Date(row.created_at || Date.now()).getTime(),
          render: (row) => {
            const created = row.created_at;
            const exp = row.expires_at;

            return `
              <div style="font-size: 0.78rem; line-height: 1.4;">
                <div style="color: var(--text-secondary);">
                  <strong style="color: var(--text-muted);">Asignado:</strong> ${created ? new Date(created).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                </div>
                <div style="color: var(--text-secondary); margin-top: 2px;">
                  <strong style="color: var(--text-muted);">Vence:</strong> ${exp ? new Date(exp).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : 'Sin vencimiento'}
                </div>
              </div>
            `;
          }
        },
        {
          header: 'Acciones',
          sortable: false,
          style: 'text-align: right;',
          render: (row) => {
            const isRedeemed = row.status === 'redeemed';
            return `
              <div style="display: flex; gap: 0.35rem; justify-content: flex-end; flex-wrap: wrap;">
                ${!isRedeemed ? `
                  <button class="btn btn-success btn-sm" data-action="mark-redeemed" data-id="${row.id}" style="padding: 3px 8px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 3px;" title="Marcar como Canjeado / Redimido">
                    ${icons.check} <span>Canjear</span>
                  </button>
                ` : ''}
                <button class="btn btn-secondary btn-sm" data-action="extend-expiry" data-id="${row.id}" style="padding: 3px 8px; font-size: 0.72rem;" title="Modificar fecha de expiración">
                  ${icons.clock}
                </button>
                <button class="btn btn-secondary btn-sm" data-action="toggle-status" data-id="${row.id}" data-active="${row.is_active}" style="padding: 3px 8px; font-size: 0.72rem;" title="${row.is_active ? 'Pausar' : 'Activar'}">
                  ${row.is_active ? icons.x : icons.check}
                </button>
                <button class="btn btn-danger btn-sm" data-action="delete" data-id="${row.id}" style="padding: 3px 8px; font-size: 0.72rem;" title="Eliminar asignación">
                  ${icons.trash}
                </button>
              </div>
            `;
          }
        }
      ],
      data: rawData
    });

    return `
      <div>
        <!-- 4 Tarjetas de Métricas de Seguimiento en Tiempo Real -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
          
          <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-blue);">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
              <span>Total Bonos Otorgados</span>
              <span style="color: var(--accent-blue);">${icons.gift}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-blue); margin-top: 0.3rem;">
              ${totalAssignments}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              Volumen total: $${totalGrantedVolume.toLocaleString('es-CO')}
            </div>
          </div>

          <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-green);">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
              <span>Disponibles para Canje</span>
              <span style="color: var(--accent-green);">${icons.coupon}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-green); margin-top: 0.3rem;">
              ${activeCount} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">($${activeVolume.toLocaleString('es-CO')})</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              Ofertas vigentes en manos de usuarios
            </div>
          </div>

          <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-purple);">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
              <span>Redimidos / Canjeados</span>
              <span style="color: var(--accent-purple);">${icons.award}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-purple); margin-top: 0.3rem;">
              ${redeemedCount} <span style="font-size: 0.85rem; color: var(--accent-green); font-weight: 700;">(${conversionRate}% éxito)</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              Canjeados en granja: $${redeemedVolume.toLocaleString('es-CO')}
            </div>
          </div>

          <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); border-left: 4px solid var(--accent-red);">
            <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; justify-content: space-between;">
              <span>Ofertas Expiradas</span>
              <span style="color: var(--accent-red);">${icons.alertTriangle}</span>
            </div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-red); margin-top: 0.3rem;">
              ${expiredCount}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
              Vencieron sin ser utilizadas
            </div>
          </div>

        </div>

        <!-- Tabla interactiva -->
        <div id="user-bonuses-datatable">
          ${this.dataTable.render()}
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    if (this.dataTable) {
      const dtContainer = container.querySelector('#user-bonuses-datatable');
      if (dtContainer) this.dataTable.attachEvents(dtContainer);
    }

    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        const isActive = btn.getAttribute('data-active') === 'true';
        this.handleAction(action, id, isActive);
      });
    });
  }

  async handleAction(action, id, isActive) {
    const rawData = this.parentView.dataStore.user_marketing_bonuses || [];
    const item = rawData.find(ub => ub.id === id);
    if (!item) return;

    if (action === 'mark-redeemed') {
      if (confirm(`¿Marcar este bono de $${Number(item.amount || 0).toLocaleString('es-CO')} como Redimido / Canjeado por el usuario?`)) {
        const res = await marketingService.updateUserMarketingBonus(id, { status: 'redeemed' });
        if (res.success) {
          toast.success('¡Bono marcado como redimido!');
          item.status = 'redeemed';
          this.parentView.updateView();
        } else {
          toast.error('Error al actualizar: ' + res.error);
        }
      }
    } else if (action === 'extend-expiry') {
      const currentExp = item.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : '';
      const newDateStr = prompt('Ingresa nueva fecha de expiración (formato YYYY-MM-DD):', currentExp ? currentExp.slice(0, 10) : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));

      if (newDateStr) {
        const newDate = new Date(newDateStr + 'T23:59:59').toISOString();
        const res = await marketingService.updateUserMarketingBonus(id, {
          status: 'active',
          is_active: true,
          expires_at: newDate
        });
        if (res.success) {
          toast.success('¡Fecha de expiración extendida exitosamente!');
          item.expires_at = newDate;
          item.status = 'active';
          item.is_active = true;
          this.parentView.updateView();
        } else {
          toast.error('Error al actualizar fecha: ' + res.error);
        }
      }
    } else if (action === 'toggle-status') {
      const newStatus = !isActive;
      const res = await marketingService.toggleUserMarketingBonusStatus(id, newStatus);
      if (res.success) {
        toast.success(`Bono ${newStatus ? 'activado' : 'pausado'}`);
        item.is_active = newStatus;
        this.parentView.updateView();
      } else {
        toast.error('Error al actualizar estado: ' + res.error);
      }
    } else if (action === 'delete') {
      if (confirm('¿Eliminar este registro de asignación de bono?')) {
        const res = await marketingService.deleteUserMarketingBonus(id);
        if (res.success) {
          toast.success('Registro eliminado');
          this.parentView.dataStore.user_marketing_bonuses = this.parentView.dataStore.user_marketing_bonuses.filter(ub => ub.id !== id);
          this.parentView.updateView();
        } else {
          toast.error('Error al eliminar: ' + res.error);
        }
      }
    }
  }

  openAssignModal() {
    const rawData = this.parentView.dataStore.user_marketing_bonuses || [];
    const profiles = this.parentView.profilesList || [];

    // Campañas existentes para autocompletar
    const existingCampaigns = Array.from(new Set(rawData.map(r => r.campaign_name).filter(Boolean)));

    modal.open({
      title: 'Asignar Bono de Consumo a Inversionista',
      size: 'medium',
      contentHtml: `
        <form id="form-assign-user-bonus" style="display: flex; flex-direction: column; gap: 1rem;">
          
          <div style="background: rgba(0, 209, 178, 0.08); border: 1px solid var(--accent-green); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--text-primary);">
            <strong style="color: var(--accent-green);">${icons.users} Asignación en Tiempo Real:</strong> Otorga bonos de consumo directamente a uno o todos los inversionistas con registro inmediato en <code>user_marketing_bonuses</code>.
          </div>

          <div class="form-group">
            <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
              Nombre de la Campaña / Motivo: *
            </label>
            <input type="text" id="uab-campaign-name" list="campaigns-datalist" class="form-control" placeholder="Ej: Bono Fidelización Granja / Fin de Semana Lechón" required style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);" />
            <datalist id="campaigns-datalist">
              ${existingCampaigns.map(c => `<option value="${c}"></option>`).join('')}
            </datalist>
          </div>

          <div class="form-group">
            <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
              Seleccionar Inversionista Destinatario: *
            </label>
            <select id="uab-user-id" class="form-control" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);" required>
              <option value="" disabled selected>-- Elige un usuario --</option>
              <option value="ALL">🌟 Todos los usuarios registrados (${profiles.length})</option>
              ${profiles.map(p => `
                <option value="${p.id}">
                  ${p.fullName || p.full_name || 'Sin Nombre'} (${p.email || p.whatsapp || p.id.slice(0, 6)})
                </option>
              `).join('')}
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Monto del Bono: *
              </label>
              <input type="text" id="uab-amount" class="form-control" placeholder="$50.000" value="$50.000" required style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--accent-green); font-weight: 800; border: 1px solid var(--border-color); border-radius: var(--radius-sm);" />
            </div>

            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Fecha de Expiración:
              </label>
              <input type="datetime-local" id="uab-expires" class="form-control" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);" />
            </div>
          </div>

          <div class="form-group">
            <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
              Estado Inicial:
            </label>
            <select id="uab-status" class="form-control" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
              <option value="active" selected>Disponible / Activo (Para redimir en tienda)</option>
              <option value="redeemed">Redimido / Canjeado Inmediatamente</option>
            </select>
          </div>

        </form>
      `,
      onInit: (modalBody) => {
        const amtInput = modalBody.querySelector('#uab-amount');
        if (amtInput) setupCurrencyInput(amtInput);
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: 'Asignar Bono',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const campaignName = document.getElementById('uab-campaign-name').value.trim();
            const targetUser = document.getElementById('uab-user-id').value;
            const amount = parseCurrency(document.getElementById('uab-amount').value);
            const expiresInput = document.getElementById('uab-expires').value;
            const status = document.getElementById('uab-status').value;

            if (!campaignName) {
              toast.error('Por favor ingresa el nombre de la campaña o motivo');
              return;
            }

            if (!targetUser) {
              toast.error('Por favor selecciona un usuario');
              return;
            }

            if (amount <= 0) {
              toast.error('Por favor ingresa un monto mayor a $0');
              return;
            }

            const expiresAt = expiresInput ? new Date(expiresInput).toISOString() : null;

            let targetUserIds = [];
            if (targetUser === 'ALL') {
              targetUserIds = profiles.map(p => p.id);
            } else {
              targetUserIds = [targetUser];
            }

            const items = targetUserIds.map(uid => ({
              campaign_name: campaignName,
              user_id: uid,
              amount,
              status,
              is_active: true,
              expires_at: expiresAt
            }));

            const btn = e.target;
            btn.disabled = true;
            btn.textContent = 'Procesando...';

            const res = await marketingService.createUserMarketingBonusesBatch(items);
            if (res.success) {
              toast.success(`¡Bono asignado con éxito a ${items.length} usuario(s)!`);
              m.close();
              await this.refreshData();
            } else {
              toast.error('Error al asignar: ' + res.error);
              btn.disabled = false;
              btn.textContent = 'Asignar Bono';
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
