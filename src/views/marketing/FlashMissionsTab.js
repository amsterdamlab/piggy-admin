/* ==========================================================================
   MARKETING - MISIONES: SUB-TAB 2: MISIONES FLASH MANUALES (user_flash_missions)
   Columnas: Nombre Usuario, Misión Flash, Oferta (Tipo + Precio + Estado Compra), Estado (Activa + Caducidad + Creación), Acciones
   ========================================================================== */

import { marketingService } from '../../services/marketingService.js';
import { DataTable } from '../../components/DataTable.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';
import { getPiggyCategoryBadge, getPiggyCategoryInfo, renderCategorySelectOptions } from '../../utils/piggyCategories.js';
import { formatCurrency, parseCurrency, setupCurrencyInput, setupDateTimePicker } from '../../utils/formUtils.js';

export class FlashMissionsTab {
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
    const totalFlash = rawData.length;
    const acceptedMissions = rawData.filter(f => f.is_purchased === true);
    const acceptedCount = acceptedMissions.length;
    const conversionRate = totalFlash > 0 ? Math.round((acceptedCount / totalFlash) * 100) : 0;
    const totalAcceptedVolume = acceptedMissions.reduce((sum, f) => sum + Number(f.price || 0), 0);

    // Identificar top comprador de ofertas flash
    const buyerMap = {};
    const buyerVolumeMap = {};
    acceptedMissions.forEach(f => {
      if (f.user_id) {
        buyerMap[f.user_id] = (buyerMap[f.user_id] || 0) + 1;
        buyerVolumeMap[f.user_id] = (buyerVolumeMap[f.user_id] || 0) + Number(f.price || 0);
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

    // Total de saldo disponible en billeteras de usuarios listos para comprar
    const totalAvailableWallet = profiles.reduce((sum, p) => sum + Number(p.walletBalance || p.wallet_balance || 0), 0);
    const usersWithBalanceCount = profiles.filter(p => Number(p.walletBalance || p.wallet_balance || 0) > 0).length;

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar misiones flash, usuario o tipo de piggy...',
      actionButton: {
        text: 'Nueva Misión Flash',
        icon: icons.plus,
        onClick: () => this.openModal()
      },
      columns: [
        {
          header: 'Nombre Usuario',
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
          header: 'Misión Flash',
          render: (row) => `
            <div>
              <div style="font-weight: 800; color: var(--text-primary); font-size: 0.9rem;">
                ${row.title || row.mission_title || 'Misión Flash'}
              </div>
              ${row.benefit_title ? `
                <div style="font-size: 0.75rem; color: var(--accent-gold); font-weight: 700; margin-top: 2px;">
                  ✨ ${row.benefit_title}
                </div>
              ` : ''}
              <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 260px; margin-top: 2px;">
                ${row.benefit_description || row.description || 'Sin descripción'}
              </div>
            </div>
          `
        },
        {
          header: 'Oferta',
          render: (row) => {
            const piggyBadge = getPiggyCategoryBadge(row.piggy_type, row.badge || row.piggy_label);

            const labelHtml = row.piggy_label ? `
              <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">
                ${row.piggy_label}
              </div>
            ` : '';

            const priceHtml = `
              <div style="font-weight: 800; color: var(--accent-gold); font-size: 0.95rem; margin-top: 1px;">
                $${Number(row.price || 0).toLocaleString('es-CO')}
              </div>
            `;

            const offerBadge = row.is_purchased === true
              ? `<div style="margin-top: 3px; display: flex; align-items: center; gap: 5px;">
                   <span class="badge badge-success" style="padding: 1px 6px; font-size: 0.7rem;">Aceptada</span>
                   ${row.purchased_at ? `<span style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">${new Date(row.purchased_at).toLocaleDateString('es-CO')}</span>` : ''}
                 </div>`
              : '<div style="margin-top: 3px;"><span class="badge badge-danger" style="padding: 1px 6px; font-size: 0.7rem;">Cancelada</span></div>';

            return `
              <div>
                ${piggyBadge}
                ${labelHtml}
                ${priceHtml}
                ${offerBadge}
              </div>
            `;
          }
        },
        {
          header: 'Estado',
          render: (row) => {
            const activeBadge = `
              <span class="badge ${row.is_active ? 'badge-success' : 'badge-neutral'}">
                ${row.is_active ? 'Activa' : 'Inactiva'}
              </span>
            `;

            const expHtml = row.scheduled_at ? `
              <div style="margin-top: 4px;">
                <span class="badge badge-info" style="font-size: 0.72rem; padding: 2px 7px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: var(--accent-blue); display: inline-flex; align-items: center; gap: 4px;">
                  <span>⏳ Exp: ${new Date(row.scheduled_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </span>
              </div>
            ` : '<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">Sin caducidad</div>';

            const createdHtml = `
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px; font-family: monospace;">
                Creado: ${row.created_at ? new Date(row.created_at).toLocaleDateString('es-CO') : '-'}
              </div>
            `;

            return `
              <div>
                ${activeBadge}
                ${expHtml}
                ${createdHtml}
              </div>
            `;
          }
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (row) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="edit" title="Editar Misión Flash">
                ${icons.edit}
              </button>
              <button class="btn btn-secondary btn-sm" data-action="delete" style="color: var(--accent-red);" title="Eliminar Misión Flash">
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
      <div class="flash-missions-tab-container">
        <!-- Bloques de Métricas e Inteligencia de Negocio para Ofertas Flash -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
          
          <!-- Bloque 1: Ofertas Aceptadas -->
          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--accent-green); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
              🏆 Ofertas Aceptadas (Conversión)
            </div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary);">
              ${acceptedCount} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">/ ${totalFlash} (${conversionRate}%)</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
              $${totalAcceptedVolume.toLocaleString('es-CO')} vendidos
            </div>
          </div>

          <!-- Bloque 2: Top Comprador -->
          <div style="background: rgba(255, 75, 139, 0.08); border: 1px solid rgba(255, 75, 139, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
            <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--primary-pink); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
              🔥 Top Comprador de Ofertas
            </div>
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${topBuyerName}">
              ${topBuyerName}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
              ${topBuyerCount > 0 ? `${topBuyerCount} ofertas ($${topBuyerVolume.toLocaleString('es-CO')})` : 'Sin compras registradas'}
            </div>
          </div>

          <!-- Bloque 3: Capital Disponible en Billeteras (Con Botón Popup) -->
          <div style="background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
              <div>
                <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--accent-blue); font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
                  ⚡ Saldo en Billeteras (Oportunidad)
                </div>
                <div style="font-size: 1.2rem; font-weight: 800; color: var(--accent-blue);">
                  $${totalAvailableWallet.toLocaleString('es-CO')}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                  ${usersWithBalanceCount} usuarios con saldo listo
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" id="btn-view-wallet-users" style="padding: 4px 10px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 5px; margin-top: 2px; border-color: rgba(59, 130, 246, 0.4); color: var(--accent-blue);" title="Ver listado de usuarios con saldo disponible">
                ${icons.eye || icons.wallet} <span>Ver Usuarios</span>
              </button>
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

    const btnWalletUsers = container.querySelector('#btn-view-wallet-users');
    if (btnWalletUsers) {
      btnWalletUsers.addEventListener('click', () => {
        this.openWalletUsersModal();
      });
    }
  }

  openWalletUsersModal() {
    const profiles = this.parentView.profilesList || [];
    
    // Filtrar y ordenar usuarios con saldo disponible de mayor a menor
    const usersWithBalance = profiles
      .filter(p => Number(p.walletBalance || p.wallet_balance || 0) > 0)
      .sort((a, b) => Number(b.walletBalance || b.wallet_balance || 0) - Number(a.walletBalance || a.wallet_balance || 0));

    const totalBalance = usersWithBalance.reduce((sum, p) => sum + Number(p.walletBalance || p.wallet_balance || 0), 0);

    const listHtml = usersWithBalance.length > 0 ? usersWithBalance.map((user, idx) => {
      const name = user.fullName || user.full_name || 'Inversionista';
      const email = user.email || '';
      const phone = user.whatsapp || user.phone || '';
      const balance = Number(user.walletBalance || user.wallet_balance || 0);
      const totalCompra = Number(user.totalCompraPiggies || user.total_compra_piggies || 0);

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1rem; margin-bottom: 0.6rem; background: var(--bg-sidebar); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0; flex: 1;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(59, 130, 246, 0.15); color: var(--accent-blue); font-weight: 800; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              ${idx + 1}
            </div>
            <div style="min-width: 0;">
              <div style="font-weight: 800; color: var(--text-primary); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${name}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">
                ${email} ${phone ? `• ${phone}` : ''}
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 1.25rem; margin-left: 1rem;">
            <div style="text-align: right;">
              <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Saldo Billetera</div>
              <div style="font-weight: 800; color: var(--accent-green); font-size: 1.05rem;">
                $${balance.toLocaleString('es-CO')}
              </div>
            </div>

            <div style="text-align: right; display: none; @media(min-width: 600px){display: block;}">
              <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Piggys Comprados</div>
              <div style="font-weight: 700; color: var(--primary-pink); font-size: 0.85rem;">
                $${totalCompra.toLocaleString('es-CO')}
              </div>
            </div>

            <button class="btn btn-secondary btn-sm launch-flash-user-btn" data-user-id="${user.id}" style="padding: 4px 8px; font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;" title="Lanzar Misión Flash a este usuario">
              ${icons.zap} <span>Lanzar Misión</span>
            </button>
          </div>
        </div>
      `;
    }).join('') : '<div class="p-4 text-center text-muted">No hay usuarios con saldo disponible actualmente.</div>';

    modal.open({
      title: 'Usuarios con Saldo Disponible en Billetera',
      contentHtml: `
        <div>
          <!-- Resumen de Capital -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding: 0.85rem 1.1rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div>
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Capital Total Disponible</div>
              <div style="font-weight: 800; font-size: 1.3rem; color: var(--accent-blue);">
                $${totalBalance.toLocaleString('es-CO')}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Usuarios Listos</div>
              <div style="font-weight: 800; font-size: 1.1rem; color: var(--text-primary);">
                ${usersWithBalance.length} inversionistas
              </div>
            </div>
          </div>

          <div style="max-height: 55vh; overflow-y: auto; padding-right: 0.25rem;">
            ${listHtml}
          </div>
        </div>
      `,
      footerButtons: [
        { text: 'Cerrar', class: 'btn-secondary', onClick: (e, m) => m.close() }
      ]
    });

    // Conectar botón para lanzar misión directa desde el modal
    setTimeout(() => {
      const modalEl = document.querySelector('.modal-container');
      if (modalEl) {
        modalEl.querySelectorAll('.launch-flash-user-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const uid = btn.getAttribute('data-user-id');
            modal.close();
            this.openModal({ user_id: uid });
          });
        });
      }
    }, 100);
  }

  handleAction(action, row) {
    if (action === 'edit') {
      this.openModal(row);
    } else if (action === 'delete') {
      if (confirm(`¿Eliminar la misión flash "${row.title}"?`)) {
        marketingService.deleteUserFlashMission(row.id).then(res => {
          if (res.success) {
            toast.success('Misión flash eliminada');
            this.parentView.dataStore.user_flash_missions = this.parentView.dataStore.user_flash_missions.filter(item => item.id !== row.id);
            this.dataTable.setData(this.parentView.dataStore.user_flash_missions);
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
    const isEdit = Boolean(item && item.id);
    const profiles = this.parentView.profilesList || [];
    const exclusiveConfigs = this.parentView.dataStore.exclusive_piggy_config || [];

    const userOptions = profiles.map(p => {
      const name = p.fullName || p.full_name || p.email;
      const isSelected = item?.user_id === p.id ? 'selected' : '';
      return `<option value="${p.id}" ${isSelected}>${name} (${p.email || p.id.slice(0,8)})</option>`;
    }).join('');

    const scheduledVal = item?.scheduled_at ? new Date(item.scheduled_at).toISOString().slice(0, 16) : '';
    const initialType = item?.piggy_type || 'dorado';
    const initialCatInfo = getPiggyCategoryInfo(initialType);

    // Buscar si hay un override de precio en exclusive_piggy_config
    const exclusiveOverride = exclusiveConfigs.find(c => c.piggy_type === initialType);
    const defaultInitialPrice = exclusiveOverride ? Number(exclusiveOverride.price) : initialCatInfo.defaultPrice;

    modal.open({
      title: isEdit ? 'Editar Misión Flash' : 'Nueva Misión Flash',
      contentHtml: `
        <form id="flash-form">
          <div class="form-row">
            <div class="form-group" style="flex: 1.2;">
              <label class="form-label" for="flash-user">Usuario Destinatario</label>
              <select id="flash-user" class="form-select">
                <option value="">-- Global (Todos los usuarios) --</option>
                ${userOptions}
              </select>
            </div>

            <div class="form-group" style="flex: 1.2;">
              <label class="form-label" for="flash-type">Tipo de Piggy</label>
              <select id="flash-type" class="form-select">
                ${renderCategorySelectOptions(initialType, exclusiveConfigs)}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-title">Título de la Misión</label>
              <input type="text" id="flash-title" class="form-input" placeholder="Ej: ¡Acelera tu Crecimiento!" value="${item?.title || (isEdit ? '' : initialCatInfo.title)}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="flash-piggy-label">Etiqueta del Piggy (Nombre)</label>
              <input type="text" id="flash-piggy-label" class="form-input" placeholder="Ej: Piggy Flash 45D" value="${item?.piggy_label || (isEdit ? '' : initialCatInfo.piggyLabel)}" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-badge">Badge / Cinta Visual</label>
              <input type="text" id="flash-badge" class="form-input" placeholder="Ej: ⚡ OFERTA FLASH · 45 DÍAS" value="${item?.badge || (isEdit ? '' : initialCatInfo.badge)}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="flash-benefit-title">Título del Beneficio</label>
              <input type="text" id="flash-benefit-title" class="form-input" placeholder="Ej: Reducción de 45 días de espera" value="${item?.benefit_title || (isEdit ? '' : initialCatInfo.benefitTitle)}" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="flash-benefit-desc">Detalle del Beneficio</label>
            <input type="text" id="flash-benefit-desc" class="form-input" placeholder="Ej: Inicia tu cerdito en el día 45 ahorrando tiempo." value="${item?.benefit_description || (isEdit ? '' : initialCatInfo.benefitDescription)}" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="flash-desc">Descripción General / Instrucciones</label>
            <textarea id="flash-desc" class="form-textarea" placeholder="Explica la oferta temporal al usuario...">${item?.description || (isEdit ? '' : initialCatInfo.description)}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-price">Precio de la Oferta</label>
              <div class="currency-input-wrapper">
                <span class="currency-input-prefix">$</span>
                <input type="text" id="flash-price" class="form-input" value="${formatCurrency(item?.price !== undefined ? item.price : defaultInitialPrice)}" placeholder="1.200.000" required />
              </div>
            </div>

            <div class="form-group datetime-enhanced-group">
              <label class="form-label" for="flash-scheduled">Caducidad (Fecha y Hora)</label>
              <input type="datetime-local" id="flash-scheduled" class="form-input" value="${scheduledVal}" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-purchased">Oferta (Compra)</label>
              <select id="flash-purchased" class="form-select">
                <option value="false" ${item?.is_purchased !== true ? 'selected' : ''}>Cancelada (No comprada)</option>
                <option value="true" ${item?.is_purchased === true ? 'selected' : ''}>Aceptada (Comprada)</option>
              </select>
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
      onInit: (modalBody) => {
        const typeSelect = modalBody.querySelector('#flash-type');
        const priceInput = modalBody.querySelector('#flash-price');
        const titleInput = modalBody.querySelector('#flash-title');
        const piggyLabelInput = modalBody.querySelector('#flash-piggy-label');
        const badgeInput = modalBody.querySelector('#flash-badge');
        const benefitTitleInput = modalBody.querySelector('#flash-benefit-title');
        const benefitDescInput = modalBody.querySelector('#flash-benefit-desc');
        const descInput = modalBody.querySelector('#flash-desc');
        const scheduledInput = modalBody.querySelector('#flash-scheduled');

        // Formato monetario con separador de miles dinámico
        const priceCtrl = setupCurrencyInput(priceInput);

        // Selector mini-calendario con botón azul
        setupDateTimePicker(scheduledInput);

        if (typeSelect) {
          typeSelect.addEventListener('change', (e) => {
            const selectedKey = e.target.value;
            const selectedOpt = typeSelect.options[typeSelect.selectedIndex];
            const catInfo = getPiggyCategoryInfo(selectedKey);

            const suggestedPrice = selectedOpt.getAttribute('data-price') || catInfo.defaultPrice;
            if (priceCtrl && (!isEdit || priceCtrl.getRawValue() === 0)) {
              priceCtrl.setRawValue(suggestedPrice);
            }

            const optPiggyLabel = selectedOpt.getAttribute('data-piggy-label') || catInfo.piggyLabel;
            const optBadge = selectedOpt.getAttribute('data-badge') || catInfo.badge;
            const optBenefitTitle = selectedOpt.getAttribute('data-benefit-title') || catInfo.benefitTitle;
            const optBenefitDesc = selectedOpt.getAttribute('data-benefit-desc') || catInfo.benefitDescription;
            const optTitle = selectedOpt.getAttribute('data-title') || catInfo.title;

            if (titleInput) titleInput.value = optTitle;
            if (piggyLabelInput) piggyLabelInput.value = optPiggyLabel;
            if (badgeInput) badgeInput.value = optBadge;
            if (benefitTitleInput) benefitTitleInput.value = optBenefitTitle;
            if (benefitDescInput) benefitDescInput.value = optBenefitDesc;
            if (descInput) descInput.value = catInfo.description;
          });
        }
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Guardar Cambios' : 'Lanzar Misión Flash',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const root = m?.overlay || document;
            const title = root.querySelector('#flash-title')?.value?.trim();
            const piggy_label = root.querySelector('#flash-piggy-label')?.value?.trim();
            const badge = root.querySelector('#flash-badge')?.value?.trim();
            const benefit_title = root.querySelector('#flash-benefit-title')?.value?.trim();
            const benefit_description = root.querySelector('#flash-benefit-desc')?.value?.trim();
            const description = root.querySelector('#flash-desc')?.value?.trim();
            const user_id = root.querySelector('#flash-user')?.value || null;
            const piggy_type = root.querySelector('#flash-type')?.value;
            const price = parseCurrency(root.querySelector('#flash-price')?.value);
            const scheduled_at = root.querySelector('#flash-scheduled')?.value;
            const is_purchased = root.querySelector('#flash-purchased')?.value === 'true';
            const is_active = root.querySelector('#flash-active')?.value === 'true';

            if (!title) {
              toast.error('Ingresa el título de la misión flash');
              return;
            }

            const catInfo = getPiggyCategoryInfo(piggy_type);

            const payload = {
              title,
              description,
              user_id,
              piggy_type,
              piggy_label: piggy_label || catInfo.piggyLabel,
              benefit_title: benefit_title || catInfo.benefitTitle,
              benefit_description: benefit_description || catInfo.benefitDescription,
              badge: badge || catInfo.badge,
              price: Number(price || 0),
              scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
              is_purchased,
              purchased_at: is_purchased ? (item?.purchased_at || new Date().toISOString()) : null,
              is_active,
              mission_title: 'MISIÓN FLASH',
              icon: catInfo.icon || '⚡'
            };

            let res;
            if (isEdit) {
              res = await marketingService.updateUserFlashMission(item.id, payload);
            } else {
              res = await marketingService.createUserFlashMission(payload);
            }

            if (res.success) {
              toast.success(isEdit ? 'Misión flash actualizada' : 'Misión flash creada con éxito');
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
