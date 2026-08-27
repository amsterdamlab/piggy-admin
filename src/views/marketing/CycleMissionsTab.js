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
    const rawData = data || [];
    const profiles = this.parentView.profilesList || [];

    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.id] = p;
    });

    // 1. Cálculos de Inteligencia de Negocio para las tarjetas de métricas
    const totalOffers = rawData.length;
    const acceptedOffers = rawData.filter(r => r.is_completed === true);
    const acceptedCount = acceptedOffers.length;
    const conversionRate = totalOffers > 0 ? Math.round((acceptedCount / totalOffers) * 100) : 0;
    const totalAcceptedVolume = acceptedOffers.reduce((sum, r) => sum + Number(r.price || 0), 0);

    // Identificar top inversionista en ofertas de ciclos
    const buyerMap = {};
    const buyerVolumeMap = {};
    acceptedOffers.forEach(r => {
      if (r.user_id) {
        buyerMap[r.user_id] = (buyerMap[r.user_id] || 0) + 1;
        buyerVolumeMap[r.user_id] = (buyerVolumeMap[r.user_id] || 0) + Number(r.price || 0);
      }
    });

    let topBuyerName = 'Ninguno';
    let topBuyerCount = 0;
    let topBuyerVolume = 0;
    Object.entries(buyerMap).forEach(([uid, count]) => {
      if (count > topBuyerCount) {
        topBuyerCount = count;
        topBuyerVolume = buyerVolumeMap[uid] || 0;
        const p = profileMap[uid] || {};
        topBuyerName = p.fullName || p.full_name || p.name || `Usuario ${uid.slice(0, 8)}`;
      }
    });

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar ofertas por usuario o tipo de piggy...',
      actionButton: {
        text: 'Nueva Oferta Post-Ciclo',
        icon: icons.plus,
        onClick: () => this.openModal()
      },
      columns: [
        {
          header: 'Usuario',
          render: (row) => {
            if (!row.user_id) {
              return '<span class="badge badge-neutral" style="font-weight: 700;">Global (Todos)</span>';
            }
            const p = profileMap[row.user_id] || {};
            const name = p.fullName || p.full_name || p.name || 'Inversionista';
            const email = p.email || row.user_id;
            return `
              <div>
                <div style="font-weight: 800; color: var(--text-primary); font-size: 0.9rem;">
                  ${name}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace; margin-top: 1px;">
                  ${email}
                </div>
                <div style="margin-top: 5px;">
                  <button class="btn btn-secondary btn-sm" data-action="view-user-detail" data-uid="${row.user_id}" style="padding: 2px 8px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px; border-radius: var(--radius-sm);" title="Ver Detalle del Usuario">
                    ${icons.eye || icons.user} <span>Ver Detalle</span>
                  </button>
                </div>
              </div>
            `;
          }
        },
        {
          header: 'Oferta',
          render: (row) => {
            const piggyBadge = `
              <span class="badge badge-info" style="font-weight: 800; text-transform: uppercase; font-size: 0.72rem; padding: 1px 7px; margin-bottom: 3px; display: inline-block;">
                ${row.piggy_type || row.piggy_label || 'Plus'}
              </span>
            `;

            const priceHtml = `
              <div style="font-weight: 800; color: var(--accent-gold); font-size: 0.95rem; margin-top: 1px;">
                $${Number(row.price || 0).toLocaleString('es-CO')}
              </div>
            `;

            // Lógica de Estado de Compra:
            // 1. is_completed === true -> Aceptada
            // 2. !is_completed y dentro de fecha de expiración -> Pendiente
            // 3. !is_completed y ya expiró -> Cancelada
            let offerStatusHtml = '';
            if (row.is_completed === true) {
              const pDate = row.purchased_at ? new Date(row.purchased_at).toLocaleDateString('es-CO') : '';
              offerStatusHtml = `
                <div style="margin-top: 3px; display: flex; align-items: center; gap: 5px;">
                  <span class="badge badge-success" style="padding: 1px 6px; font-size: 0.7rem;">Aceptada</span>
                  ${pDate ? `<span style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">${pDate}</span>` : ''}
                </div>
              `;
            } else {
              const isExpired = row.expires_at ? new Date(row.expires_at) <= new Date() : false;
              if (isExpired) {
                offerStatusHtml = `
                  <div style="margin-top: 3px;">
                    <span class="badge badge-danger" style="padding: 1px 6px; font-size: 0.7rem;">Cancelada</span>
                  </div>
                `;
              } else {
                offerStatusHtml = `
                  <div style="margin-top: 3px;">
                    <span class="badge badge-warning" style="padding: 1px 6px; font-size: 0.7rem;">Pendiente</span>
                  </div>
                `;
              }
            }

            return `
              <div>
                ${piggyBadge}
                ${priceHtml}
                ${offerStatusHtml}
              </div>
            `;
          }
        },
        {
          header: 'Creación',
          render: (row) => `
            <span style="font-size: 0.78rem; color: var(--text-muted); font-family: monospace;">
              ${row.created_at ? new Date(row.created_at).toLocaleDateString('es-CO') : '-'}
            </span>
          `
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (row) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="edit" title="Editar Oferta Post-Ciclo">
                ${icons.edit}
              </button>
              <button class="btn btn-secondary btn-sm" data-action="delete" style="color: var(--accent-red);" title="Eliminar Oferta Post-Ciclo">
                ${icons.trash}
              </button>
            </div>
          `
        }
      ],
      data: rawData,
      onRowAction: (action, row) => this.handleAction(action, row)
    });

    return `
      <div class="cycle-missions-tab-container">
        <!-- Bloques de Métricas de Ciclos Completados -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
          
          <!-- Bloque 1: Ofertas Aceptadas -->
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--accent-green); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
              🏆 Ofertas Aceptadas Post-Ciclo
            </div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary);">
              ${acceptedCount} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">/ ${totalOffers} (${conversionRate}%)</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
              $${totalAcceptedVolume.toLocaleString('es-CO')} vendidos
            </div>
          </div>

          <!-- Bloque 2: Top Inversionista en Ofertas Post-Ciclo -->
          <div style="background: rgba(255, 75, 139, 0.08); border: 1px solid rgba(255, 75, 139, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--primary-pink); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
              🔥 Top Inversionista Post-Ciclo
            </div>
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${topBuyerName}">
              ${topBuyerName}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
              ${topBuyerCount > 0 ? `${topBuyerCount} ofertas ($${topBuyerVolume.toLocaleString('es-CO')})` : 'Sin compras registradas'}
            </div>
          </div>

          <!-- Bloque 3: Volumen Comprado -->
          <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--accent-gold); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
              💰 Volumen Total Adquirido
            </div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--accent-gold);">
              $${totalAcceptedVolume.toLocaleString('es-CO')}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
              En ${acceptedCount} recompras completadas
            </div>
          </div>

        </div>

        ${this.dataTable.render()}
      </div>
    `;
  }

  attachEvents(container) {
    if (this.dataTable) {
      this.dataTable.attachEvents(container);
    }
  }

  handleAction(action, row) {
    if (action === 'edit') {
      this.openModal(row);
    } else if (action === 'delete') {
      if (confirm(`¿Eliminar esta oferta de cerdito exclusivo?`)) {
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
    } else if (action === 'view-user-detail') {
      const p = (this.parentView.profilesList || []).find(prof => prof.id === row.user_id) || {};
      this.openUserProfileModal(p);
    }
  }

  openUserProfileModal(user) {
    const fullName = user.fullName || user.full_name || 'Inversionista';
    const email = user.email || 'No registrado';
    const whatsapp = user.whatsapp || user.phone || 'No registrado';
    const cedula = user.cedula || 'No registrada';
    const refCode = user.referralCode || user.referral_code || 'Sin código';
    const bankName = user.bankName || user.bank_name || 'No registrado';
    const bankBreveKey = user.bankBreveKey || user.bank_breve_key || 'No registrada';
    const walletBalance = Number(user.walletBalance || user.wallet_balance || 0);
    const totalCompraPiggies = Number(user.totalCompraPiggies || user.total_compra_piggies || 0);
    const activePiggiesCount = user.activePiggiesCount !== undefined ? user.activePiggiesCount : 0;
    const totalPiggiesCount = user.totalPiggiesCount !== undefined ? user.totalPiggiesCount : 0;

    modal.open({
      title: `Detalle del Usuario: ${fullName}`,
      contentHtml: `
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- 1. Información de Identificación & Contacto -->
          <div style="background: var(--bg-dark); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.4rem;">
              Información de Identificación & Contacto
            </div>
            <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.85rem;">
              ${fullName}
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; font-size: 0.85rem;">
              <div>
                <span style="color: var(--text-muted);">Email:</span>
                <div style="font-weight: 700; color: var(--accent-blue); font-family: monospace;">${email}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">WhatsApp:</span>
                <div style="font-weight: 700; color: var(--accent-green);">${whatsapp}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Cédula:</span>
                <div style="font-weight: 700; color: var(--text-primary);">${cedula}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Código Referido:</span>
                <div style="font-weight: 700; color: var(--accent-gold); font-family: monospace;">${refCode}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Banco:</span>
                <div style="font-weight: 700; color: var(--primary-pink);">${bankName}</div>
              </div>
              <div>
                <span style="color: var(--text-muted);">Llave Bre-B:</span>
                <div style="font-weight: 700; color: var(--accent-gold); font-family: monospace;">${bankBreveKey}</div>
              </div>
            </div>
          </div>

          <!-- 2. Recuadros de Métricas Financieras (Igual que en Módulo Usuarios) -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            
            <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--accent-green);">${icons.wallet || '💳'}</span> Saldo Disponible en Billetera
              </div>
              <div style="font-size: 1.35rem; font-weight: 800; color: var(--accent-green); margin-top: 0.3rem;">
                $${walletBalance.toLocaleString('es-CO')}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                Listo para compra inmediata de ofertas
              </div>
            </div>

            <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--primary-pink);">${icons.pig || '🐷'}</span> Valor de Compra Piggys
              </div>
              <div style="font-size: 1.35rem; font-weight: 800; color: var(--primary-pink); margin-top: 0.3rem;">
                $${totalCompraPiggies.toLocaleString('es-CO')}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                ${activePiggiesCount} en engorde (${totalPiggiesCount} total)
              </div>
            </div>

          </div>
        </div>
      `,
      footerButtons: [
        {
          text: 'Ir a Módulo de Usuarios',
          class: 'btn-secondary',
          onClick: (e, m) => {
            m.close();
            window.location.hash = '#users';
          }
        },
        { text: 'Cerrar', class: 'btn-primary', onClick: (e, m) => m.close() }
      ]
    });
  }

  openModal(item = null) {
    const isEdit = Boolean(item);
    const profiles = this.parentView.profilesList || [];

    const userOptions = profiles.map(p => {
      const name = p.fullName || p.full_name || p.email;
      const isSelected = item?.user_id === p.id ? 'selected' : '';
      return `<option value="${p.id}" ${isSelected}>${name} (${p.email || p.id.slice(0,8)})</option>`;
    }).join('');

    const expiresVal = item?.expires_at ? new Date(item.expires_at).toISOString().slice(0, 16) : '';

    modal.open({
      title: isEdit ? 'Editar Oferta de Granja Exclusiva' : 'Nueva Oferta de Granja Exclusiva',
      contentHtml: `
        <form id="cycle-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="cycle-user">Usuario Destinatario</label>
              <select id="cycle-user" class="form-select">
                <option value="">-- Global (Todos los usuarios) --</option>
                ${userOptions}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="cycle-type">Tipo de Piggy</label>
              <select id="cycle-type" class="form-select">
                <option value="plus" ${item?.piggy_type === 'plus' ? 'selected' : ''}>Piggy Plus</option>
                <option value="premium" ${item?.piggy_type === 'premium' ? 'selected' : ''}>Piggy Premium</option>
                <option value="dorado" ${item?.piggy_type === 'dorado' ? 'selected' : ''}>Piggy Dorado</option>
                <option value="esmeralda" ${item?.piggy_type === 'esmeralda' ? 'selected' : ''}>Piggy Esmeralda</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="cycle-price">Precio de la Oferta ($)</label>
              <input type="number" id="cycle-price" class="form-input" value="${item?.price || 1000000}" step="50000" min="0" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="cycle-expires">Fecha de Expiración</label>
              <input type="datetime-local" id="cycle-expires" class="form-input" value="${expiresVal}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="cycle-completed">Estado de Compra</label>
            <select id="cycle-completed" class="form-select">
              <option value="false" ${item?.is_completed !== true ? 'selected' : ''}>Disponible / Pendiente</option>
              <option value="true" ${item?.is_completed === true ? 'selected' : ''}>Aceptada (Comprada)</option>
            </select>
          </div>
        </form>
      `,
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Guardar Cambios' : 'Disparar Oferta',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const user_id = document.querySelector('#cycle-user').value || null;
            const piggy_type = document.querySelector('#cycle-type').value;
            const price = document.querySelector('#cycle-price').value;
            const expires_at = document.querySelector('#cycle-expires').value;
            const is_completed = document.querySelector('#cycle-completed').value === 'true';

            const payload = {
              user_id,
              piggy_type,
              price: Number(price),
              expires_at: expires_at ? new Date(expires_at).toISOString() : null,
              is_completed,
              purchased_at: is_completed ? (item?.purchased_at || new Date().toISOString()) : null
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
