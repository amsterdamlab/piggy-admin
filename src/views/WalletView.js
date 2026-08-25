/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - WALLET & TREASURY VIEW
   Approval center for Bre-B/QR vouchers, withdrawals, meat redemptions & manual requests
   ========================================================================== */

import { walletService } from '../services/walletService.js';
import { DataTable } from '../components/DataTable.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { store } from '../state.js';
import { icons } from '../icons.js';

export class WalletView {
  constructor() {
    this.currentTab = 'recharges';
    this.recharges = [];
    this.withdrawals = [];
    this.meatRequests = [];
    this.transactions = [];
    this.rechargesTable = null;
    this.withdrawalsTable = null;
    this.meatTable = null;
    this.transactionsTable = null;
    this.container = null;
  }

  async render() {
    await this.loadData();

    const pendingRecharges = this.recharges.filter(r => r.status === 'pending').length;
    const pendingWithdrawals = this.withdrawals.filter(w => w.status === 'pending').length;
    const pendingMeat = this.meatRequests.filter(m => m.status === 'pending').length;
    store.setPendingCounts({ recharges: pendingRecharges, withdrawals: pendingWithdrawals, meat: pendingMeat });

    return `
      <div class="wallet-view">
        <div class="card">
          <div class="card-header" style="flex-direction: column; align-items: flex-start; gap: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; flex-wrap: wrap; gap: 0.75rem;">
              <div>
                <h2 class="card-title">${icons.wallet} Centro de Auditoría Contable</h2>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                  Validación de comprobantes de depósito (Bre-B/QR), liquidación de retiros bancarios, despachos de carne y libro contable auditado
                </div>
              </div>
              <div>
                <button class="btn btn-primary btn-sm" id="btn-create-manual-request" style="display: inline-flex; align-items: center; gap: 6px; padding: 0.5rem 0.9rem; font-weight: 700;">
                  ${icons.plus} <span>Nueva Solicitud Manual</span>
                </button>
              </div>
            </div>

            <!-- Tabs -->
            <div class="tabs-container" style="width: 100%; margin-bottom: 0; display: flex; flex-wrap: wrap; gap: 0.4rem;">
              <button class="tab-btn ${this.currentTab === 'recharges' ? 'active' : ''}" data-tab="recharges" style="display: inline-flex; align-items: center; gap: 6px;">
                ${icons.download} <span>Comprobantes de Recarga</span> ${pendingRecharges > 0 ? `<span class="badge badge-danger" style="margin-left: 4px;">${pendingRecharges}</span>` : ''}
              </button>
              <button class="tab-btn ${this.currentTab === 'withdrawals' ? 'active' : ''}" data-tab="withdrawals" style="display: inline-flex; align-items: center; gap: 6px;">
                ${icons.upload} <span>Retiros de Dinero</span> ${pendingWithdrawals > 0 ? `<span class="badge badge-warning" style="margin-left: 4px;">${pendingWithdrawals}</span>` : ''}
              </button>
              <button class="tab-btn ${this.currentTab === 'meat' ? 'active' : ''}" data-tab="meat" style="display: inline-flex; align-items: center; gap: 6px;">
                ${icons.meat} <span>Retiros de Carne (Gourmet)</span> ${pendingMeat > 0 ? `<span class="badge badge-info" style="margin-left: 4px;">${pendingMeat}</span>` : ''}
              </button>
              <button class="tab-btn ${this.currentTab === 'ledger' ? 'active' : ''}" data-tab="ledger" style="display: inline-flex; align-items: center; gap: 6px;">
                ${icons.wallet} <span>Libro Contable (Auditoría)</span>
              </button>
            </div>
          </div>

          <!-- Tab 1: Recharges -->
          <div id="tab-wallet-recharges" style="display: ${this.currentTab === 'recharges' ? 'block' : 'none'};">
            <div id="recharges-table-wrapper">
              ${this.renderRechargesTableHtml()}
            </div>
          </div>

          <!-- Tab 2: Withdrawals -->
          <div id="tab-wallet-withdrawals" style="display: ${this.currentTab === 'withdrawals' ? 'block' : 'none'};">
            <div id="withdrawals-table-wrapper">
              ${this.renderWithdrawalsTableHtml()}
            </div>
          </div>

          <!-- Tab 3: Meat Redemptions -->
          <div id="tab-wallet-meat" style="display: ${this.currentTab === 'meat' ? 'block' : 'none'};">
            <div id="meat-table-wrapper">
              ${this.renderMeatTableHtml()}
            </div>
          </div>

          <!-- Tab 4: Ledger -->
          <div id="tab-wallet-ledger" style="display: ${this.currentTab === 'ledger' ? 'block' : 'none'};">
            <div id="ledger-table-wrapper">
              ${this.renderLedgerTableHtml()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async loadData() {
    const [recharges, withdrawals, meatRequests, transactions] = await Promise.all([
      walletService.getRechargeRequests(),
      walletService.getWithdrawalRequests(),
      walletService.getMeatRequests(),
      walletService.getTransactions()
    ]);
    this.recharges = recharges;
    this.withdrawals = withdrawals;
    this.meatRequests = meatRequests;
    this.transactions = transactions;
  }

  renderRechargesTableHtml() {
    this.rechargesTable = new DataTable({
      searchPlaceholder: 'Buscar por usuario, referencia o monto...',
      filters: [
        { label: 'Pendientes', value: 'pending' },
        { label: 'Aprobadas', value: 'approved' },
        { label: 'Rechazadas', value: 'rejected' }
      ],
      columns: [
        {
          header: 'Usuario / Contacto',
          key: 'userName',
          sortValue: (r) => r.userName,
          render: (r) => `
            <div>
              <div style="font-weight: 700; color: var(--text-primary);">${r.userName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${r.userPhone}</div>
              <div style="font-size: 0.72rem; color: var(--accent-green);">Saldo: $${r.userBalance.toLocaleString('es-CO')}</div>
            </div>
          `
        },
        {
          header: 'Monto a Acreditar',
          key: 'amount',
          sortValue: (r) => r.amount,
          render: (r) => `
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent-green);">
              $${r.amount.toLocaleString('es-CO')}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${r.paymentMethod}</div>
          `
        },
        {
          header: 'Referencia / Voucher',
          key: 'referenceCode',
          sortValue: (r) => r.referenceCode,
          render: (r) => `
            <div>
              <div style="font-weight: 700; font-family: monospace;">${r.referenceCode}</div>
              <button class="btn btn-secondary btn-sm" data-action="view-voucher" style="margin-top: 4px; display: inline-flex; align-items: center; gap: 4px;">
                ${icons.image} <span>Ver Comprobante</span>
              </button>
            </div>
          `
        },
        {
          header: 'Fecha',
          key: 'createdAt',
          sortValue: (r) => new Date(r.createdAt).getTime(),
          render: (r) => `
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              ${new Date(r.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          `
        },
        {
          header: 'Estado',
          key: 'status',
          sortValue: (r) => r.status,
          render: (r) => {
            if (r.status === 'pending') return `<span class="badge badge-warning">Pendiente</span>`;
            if (r.status === 'approved') return `<span class="badge badge-success">Aprobado</span>`;
            return `<span class="badge badge-danger">Rechazado</span>`;
          }
        },
        {
          header: 'Acciones',
          sortable: false,
          style: 'text-align: right;',
          render: (r) => {
            if (r.status === 'pending') {
              return `
                <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                  <button class="btn btn-success btn-sm" data-action="approve-recharge" title="Aprobar y abonar saldo">
                    ${icons.check} Aprobar
                  </button>
                  <button class="btn btn-danger btn-sm" data-action="reject-recharge" title="Rechazar comprobante">
                    ${icons.x}
                  </button>
                </div>
              `;
            }
            return `<span style="font-size: 0.75rem; color: var(--text-muted);">Procesado</span>`;
          }
        }
      ],
      data: this.recharges,
      onRowAction: (action, r) => this.handleRechargeAction(action, r)
    });

    return this.rechargesTable.render();
  }

  renderWithdrawalsTableHtml() {
    this.withdrawalsTable = new DataTable({
      searchPlaceholder: 'Buscar por usuario o cuenta bancaria...',
      filters: [
        { label: 'Pendientes', value: 'pending' },
        { label: 'Aprobadas', value: 'approved' },
        { label: 'Rechazadas', value: 'rejected' }
      ],
      columns: [
        {
          header: 'Usuario / Solicitante',
          key: 'userName',
          sortValue: (w) => w.userName,
          render: (w) => `
            <div>
              <div style="font-weight: 700; color: var(--text-primary);">${w.userName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${w.userPhone}</div>
              <div style="font-size: 0.72rem; color: var(--text-secondary);">Saldo: $${w.userBalance.toLocaleString('es-CO')}</div>
            </div>
          `
        },
        {
          header: 'Monto Solicitado',
          key: 'amount',
          sortValue: (w) => w.amount,
          render: (w) => `
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary-pink);">
              $${w.amount.toLocaleString('es-CO')}
            </div>
            <span class="badge badge-neutral">${w.type}</span>
          `
        },
        {
          header: 'Cuenta Bancaria de Destino',
          key: 'bankInfo',
          sortValue: (w) => w.bankInfo,
          render: (w) => `
            <div style="font-size: 0.85rem; background: var(--bg-dark); padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); max-width: 320px;">
              ${w.bankInfo}
            </div>
          `
        },
        {
          header: 'Fecha',
          key: 'createdAt',
          sortValue: (w) => new Date(w.createdAt).getTime(),
          render: (w) => `
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              ${new Date(w.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          `
        },
        {
          header: 'Estado',
          key: 'status',
          sortValue: (w) => w.status,
          render: (w) => {
            if (w.status === 'pending') return `<span class="badge badge-warning">Pendiente</span>`;
            if (w.status === 'approved') return `<span class="badge badge-success">Transferido</span>`;
            return `<span class="badge badge-danger">Rechazado</span>`;
          }
        },
        {
          header: 'Acciones',
          sortable: false,
          style: 'text-align: right;',
          render: (w) => {
            if (w.status === 'pending') {
              return `
                <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                  <button class="btn btn-success btn-sm" data-action="approve-withdrawal" title="Marcar como transferido">
                    ${icons.check} Liquidar
                  </button>
                  <button class="btn btn-danger btn-sm" data-action="reject-withdrawal" title="Rechazar">
                    ${icons.x}
                  </button>
                </div>
              `;
            }
            return `<span style="font-size: 0.75rem; color: var(--text-muted);">Procesado</span>`;
          }
        }
      ],
      data: this.withdrawals,
      onRowAction: (action, w) => this.handleWithdrawalAction(action, w)
    });

    return this.withdrawalsTable.render();
  }

  renderMeatTableHtml() {
    this.meatTable = new DataTable({
      searchPlaceholder: 'Buscar por usuario, referencia o notas...',
      filters: [
        { label: 'Pendientes', value: 'pending' },
        { label: 'Despachadas', value: 'approved' },
        { label: 'Rechazadas', value: 'rejected' }
      ],
      columns: [
        {
          header: 'Usuario / Solicitante',
          key: 'userName',
          sortValue: (m) => m.userName,
          render: (m) => `
            <div>
              <div style="font-weight: 700; color: var(--text-primary);">${m.userName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${m.userPhone}</div>
              <div style="font-size: 0.72rem; color: var(--accent-gold);">${icons.tag} Bonos disponibles: $${m.userBonos.toLocaleString('es-CO')}</div>
            </div>
          `
        },
        {
          header: 'Monto de Bonos a Canjear',
          key: 'amount',
          sortValue: (m) => m.amount,
          render: (m) => `
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent-gold);">
              $${m.amount.toLocaleString('es-CO')}
            </div>
            <span class="badge badge-warning" style="font-size: 0.7rem;">Bono de Consumo</span>
          `
        },
        {
          header: 'Referencia / Detalle de Despacho',
          key: 'referenceCode',
          sortValue: (m) => m.referenceCode,
          render: (m) => `
            <div>
              <div style="font-weight: 700; font-family: monospace; color: var(--text-primary);">${m.referenceCode}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${m.notes}</div>
            </div>
          `
        },
        {
          header: 'Fecha',
          key: 'createdAt',
          sortValue: (m) => new Date(m.createdAt).getTime(),
          render: (m) => `
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              ${new Date(m.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          `
        },
        {
          header: 'Estado',
          key: 'status',
          sortValue: (m) => m.status,
          render: (m) => {
            if (m.status === 'pending') return `<span class="badge badge-warning">Pendiente Despacho</span>`;
            if (m.status === 'approved') return `<span class="badge badge-success">Despachado / Entregado</span>`;
            return `<span class="badge badge-danger">Cancelado</span>`;
          }
        },
        {
          header: 'Acciones',
          sortable: false,
          style: 'text-align: right;',
          render: (m) => {
            if (m.status === 'pending') {
              return `
                <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                  <button class="btn btn-success btn-sm" data-action="approve-meat" title="Confirmar despacho / entrega de carne">
                    ${icons.check} Despachar
                  </button>
                  <button class="btn btn-danger btn-sm" data-action="reject-meat" title="Rechazar o cancelar solicitud">
                    ${icons.x}
                  </button>
                </div>
              `;
            }
            return `<span style="font-size: 0.75rem; color: var(--text-muted);">Despachado</span>`;
          }
        }
      ],
      data: this.meatRequests,
      onRowAction: (action, m) => this.handleMeatAction(action, m)
    });

    return this.meatTable.render();
  }

  renderLedgerTableHtml() {
    this.transactionsTable = new DataTable({
      searchPlaceholder: 'Buscar en el libro de transacciones...',
      columns: [
        {
          header: 'Usuario',
          key: 'userName',
          sortValue: (t) => t.userName,
          render: (t) => `<div style="font-weight: 700;">${t.userName}</div>`
        },
        {
          header: 'Tipo de Movimiento',
          key: 'type',
          sortValue: (t) => t.type,
          render: (t) => `<span class="badge badge-info">${t.type}</span>`
        },
        {
          header: 'Monto',
          key: 'amount',
          sortValue: (t) => t.amount,
          render: (t) => `
            <div style="font-weight: 800; color: ${t.amount >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
              ${t.amount >= 0 ? '+' : ''}$${Math.abs(t.amount).toLocaleString('es-CO')}
            </div>
          `
        },
        {
          header: 'Descripción / Auditoría',
          key: 'description',
          sortValue: (t) => t.description,
          render: (t) => `<div style="font-size: 0.8rem; color: var(--text-secondary);">${t.description}</div>`
        },
        {
          header: 'Fecha',
          key: 'createdAt',
          sortValue: (t) => new Date(t.createdAt).getTime(),
          render: (t) => `
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              ${new Date(t.createdAt).toLocaleString('es-CO')}
            </div>
          `
        }
      ],
      data: this.transactions
    });

    return this.transactionsTable.render();
  }

  attachEvents(container) {
    this.container = container;

    // Tabs
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Botón Nueva Solicitud Manual
    const createBtn = container.querySelector('#btn-create-manual-request');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        this.openCreateManualModal();
      });
    }

    if (this.rechargesTable) {
      this.rechargesTable.attachEvents(container.querySelector('#recharges-table-wrapper'));
    }
    if (this.withdrawalsTable) {
      this.withdrawalsTable.attachEvents(container.querySelector('#withdrawals-table-wrapper'));
    }
    if (this.meatTable) {
      this.meatTable.attachEvents(container.querySelector('#meat-table-wrapper'));
    }
    if (this.transactionsTable) {
      this.transactionsTable.attachEvents(container.querySelector('#ledger-table-wrapper'));
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    if (!this.container) return;

    this.container.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });

    const recEl = this.container.querySelector('#tab-wallet-recharges');
    const withEl = this.container.querySelector('#tab-wallet-withdrawals');
    const meatEl = this.container.querySelector('#tab-wallet-meat');
    const ledEl = this.container.querySelector('#tab-wallet-ledger');

    if (recEl) recEl.style.display = tab === 'recharges' ? 'block' : 'none';
    if (withEl) withEl.style.display = tab === 'withdrawals' ? 'block' : 'none';
    if (meatEl) meatEl.style.display = tab === 'meat' ? 'block' : 'none';
    if (ledEl) ledEl.style.display = tab === 'ledger' ? 'block' : 'none';
  }

  handleRechargeAction(action, r) {
    if (action === 'view-voucher') {
      modal.open({
        title: `Comprobante: ${r.referenceCode} - ${r.userName}`,
        size: 'large',
        contentHtml: `
          <div style="display: flex; flex-direction: column; gap: 1rem; align-items: center;">
            <div style="width: 100%; max-height: 480px; overflow: auto; background: var(--bg-dark); border-radius: var(--radius-md); display: flex; justify-content: center; padding: 1rem; border: 1px solid var(--border-color);">
              ${r.receiptUrl 
                ? `<img src="${r.receiptUrl}" alt="Comprobante" style="max-width: 100%; border-radius: var(--radius-sm);" onerror="this.parentElement.innerHTML='<div style=\\'padding: 3rem; color: var(--text-muted);\\'>Imagen no disponible o enlace expirado</div>';" />`
                : `<div style="padding: 3rem; color: var(--text-muted);">No se adjuntó imagen en esta solicitud</div>`
              }
            </div>
            <div style="width: 100%; display: flex; justify-content: space-between; font-size: 0.9rem; background: var(--bg-dark); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
              <div>Monto: <strong>$${r.amount.toLocaleString('es-CO')}</strong></div>
              <div>Método: <strong>${r.paymentMethod}</strong></div>
              <div>Referencia: <code>${r.referenceCode}</code></div>
            </div>
          </div>
        `,
        footerButtons: [
          { text: 'Cerrar', class: 'btn-secondary', onClick: (e, m) => m.close() }
        ]
      });
    } else if (action === 'approve-recharge') {
      if (confirm(`¿Aprobar recarga de $${r.amount.toLocaleString('es-CO')} para ${r.userName}? Se acreditará automáticamente en su billetera.`)) {
        walletService.approveRecharge(r.id, r.userId, r.amount).then(res => {
          if (res.success) {
            toast.success('¡Recarga aprobada y saldo acreditado con éxito!');
            r.status = 'approved';
            r.userBalance += r.amount;
            this.rechargesTable.setData(this.recharges);
            this.updatePendingCount();
          } else {
            toast.error(res.error || 'Error al aprobar recarga');
          }
        });
      }
    } else if (action === 'reject-recharge') {
      const reason = prompt('Indica el motivo de rechazo (ej: Comprobante ilegible):', 'Comprobante no válido');
      if (reason) {
        walletService.rejectRecharge(r.id, reason).then(res => {
          if (res.success) {
            toast.info('Solicitud de recarga rechazada');
            r.status = 'rejected';
            this.rechargesTable.setData(this.recharges);
            this.updatePendingCount();
          } else {
            toast.error(res.error || 'Error al rechazar');
          }
        });
      }
    }
  }

  handleWithdrawalAction(action, w) {
    if (action === 'approve-withdrawal') {
      if (confirm(`¿Confirmar que transferiste $${w.amount.toLocaleString('es-CO')} a la cuenta bancaria de ${w.userName}?`)) {
        walletService.approveWithdrawal(w.id, w.userId, w.amount).then(res => {
          if (res.success) {
            toast.success('Retiro marcado como transferido y liquidado');
            w.status = 'approved';
            this.withdrawalsTable.setData(this.withdrawals);
            this.updatePendingCount();
          } else {
            toast.error(res.error || 'Error al liquidar retiro');
          }
        });
      }
    } else if (action === 'reject-withdrawal') {
      const reason = prompt('Motivo del rechazo de retiro:', 'Datos bancarios erróneos');
      if (reason) {
        walletService.rejectWithdrawal(w.id, w.userId, w.amount, reason).then(res => {
          if (res.success) {
            toast.info('Solicitud de retiro rechazada');
            w.status = 'rejected';
            this.withdrawalsTable.setData(this.withdrawals);
            this.updatePendingCount();
          } else {
            toast.error(res.error || 'Error al rechazar');
          }
        });
      }
    }
  }

  handleMeatAction(action, m) {
    if (action === 'approve-meat') {
      if (confirm(`¿Confirmar despacho de productos de carne por $${m.amount.toLocaleString('es-CO')} para ${m.userName}?`)) {
        walletService.approveMeatRequest(m.id, m.userId, m.amount).then(res => {
          if (res.success) {
            toast.success('Despacho de carne confirmado y procesado');
            m.status = 'approved';
            this.meatTable.setData(this.meatRequests);
            this.updatePendingCount();
          } else {
            toast.error(res.error || 'Error al procesar despacho');
          }
        });
      }
    } else if (action === 'reject-meat') {
      const reason = prompt('Motivo de rechazo/cancelación de retiro de carne:', 'Entrega cancelada o no coordinada');
      if (reason) {
        walletService.rejectMeatRequest(m.id, m.userId, m.amount, reason).then(res => {
          if (res.success) {
            toast.info('Solicitud de retiro de carne cancelada');
            m.status = 'rejected';
            this.meatTable.setData(this.meatRequests);
            this.updatePendingCount();
          } else {
            toast.error(res.error || 'Error al cancelar solicitud');
          }
        });
      }
    }
  }

  async openCreateManualModal() {
    toast.info('Cargando usuarios...');
    const users = await walletService.getUsersList();

    if (!users || users.length === 0) {
      toast.error('No se pudieron cargar usuarios de la base de datos');
      return;
    }

    const defaultRef = `ADM-REC-${Math.floor(100000 + Math.random() * 900000)}`;

    modal.open({
      title: 'Crear Solicitud Manual en Tesorería',
      size: 'medium',
      contentHtml: `
        <form id="form-manual-wallet-request" style="display: flex; flex-direction: column; gap: 1rem;">
          
          <div style="background: rgba(255, 184, 0, 0.08); border: 1px solid var(--accent-gold); padding: 0.75rem; border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--text-secondary);">
            <strong style="color: var(--accent-gold);">${icons.shieldCheck} Control de Auditoría:</strong> Esta herramienta inserta directamente en la tabla contable <code>wallet_requests</code> manteniendo integridad con las veedurías y triggers automáticos de Supabase.
          </div>

          <!-- Usuario -->
          <div class="form-group">
            <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
              Seleccionar Usuario / Inversionista: *
            </label>
            <select id="m-user-id" class="form-control" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);" required>
              <option value="" disabled selected>-- Elige un usuario --</option>
              ${users.map(u => `
                <option value="${u.id}" data-name="${u.full_name || ''}" data-balance="${u.wallet_balance || 0}" data-bonos="${u.referral_balance || 0}">
                  ${u.full_name || 'Sin Nombre'} (${u.email || u.whatsapp || u.id.substring(0, 6)}) — Saldo: $${Number(u.wallet_balance || 0).toLocaleString('es-CO')} | Bonos: $${Number(u.referral_balance || 0).toLocaleString('es-CO')}
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Tipo de Operación -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Tipo de Solicitud: *
              </label>
              <select id="m-request-type" class="form-control" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);" required>
                <option value="recharge">📥 Recarga de Saldo (Abonar a Billetera)</option>
                <option value="withdrawal">📤 Retiro de Dinero (Debitar Billetera)</option>
                <option value="consumption">🥩 Retiro / Canje de Carne (Bonos)</option>
              </select>
            </div>

            <!-- Monto -->
            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Monto en Pesos: *
              </label>
              <input type="number" id="m-amount" class="form-control" placeholder="Ej: 500000" min="1000" step="1000" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);" required />
              <div id="m-amount-preview" style="font-size: 0.75rem; color: var(--accent-green); font-weight: 700; margin-top: 3px;">$0</div>
            </div>
          </div>

          <!-- Método / Destino y Referencia -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Método / Canal:
              </label>
              <select id="m-payment-method" class="form-control" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
                <option value="BRE_B">Bre-B (Bancolombia)</option>
                <option value="QR_CODE">Código QR Bancolombia</option>
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="DESPACHO_GRANJA">Despacho en Granja / Tienda</option>
                <option value="EFECTIVO">Caja / Efectivo</option>
                <option value="AJUSTE_AUDITORIA">Ajuste Contable de Auditoría</option>
              </select>
            </div>

            <div class="form-group">
              <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
                Código de Referencia:
              </label>
              <input type="text" id="m-reference" class="form-control" value="${defaultRef}" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-family: monospace;" required />
            </div>
          </div>

          <!-- Notas / Justificación -->
          <div class="form-group">
            <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
              Notas / Justificación de Auditoría:
            </label>
            <textarea id="m-notes" class="form-control" rows="2" placeholder="Describe el motivo de la operación o datos bancarios/de entrega..." style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); resize: vertical;"></textarea>
          </div>

          <!-- Estado Inicial -->
          <div class="form-group">
            <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: block;">
              Estado al Guardar:
            </label>
            <select id="m-initial-status" class="form-control" style="width: 100%; padding: 0.6rem; background: var(--bg-dark); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
              <option value="pending">🟡 Guardar como Pendiente (Para revisión/aprobación posterior)</option>
              <option value="approved">🟢 Aprobar y Procesar de Inmediato (Acredita o debita en tiempo real)</option>
            </select>
          </div>

        </form>
      `,
      onInit: (modalBody, m) => {
        const typeSelect = modalBody.querySelector('#m-request-type');
        const refInput = modalBody.querySelector('#m-reference');
        const amountInput = modalBody.querySelector('#m-amount');
        const previewEl = modalBody.querySelector('#m-amount-preview');

        // Actualizar referencia automática al cambiar tipo
        typeSelect.addEventListener('change', () => {
          const type = typeSelect.value;
          const prefix = type === 'recharge' ? 'REC' : (type === 'withdrawal' ? 'RET' : 'CRN');
          refInput.value = `ADM-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
        });

        // Vista previa de monto formateado
        amountInput.addEventListener('input', () => {
          const val = Number(amountInput.value || 0);
          previewEl.textContent = `$${val.toLocaleString('es-CO')}`;
        });
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: 'Crear Solicitud',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const userId = document.getElementById('m-user-id').value;
            const userSelect = document.getElementById('m-user-id');
            const selectedOption = userSelect.options[userSelect.selectedIndex];
            const userName = selectedOption ? selectedOption.getAttribute('data-name') : 'Usuario';
            const requestType = document.getElementById('m-request-type').value;
            const amount = Number(document.getElementById('m-amount').value || 0);
            const paymentMethod = document.getElementById('m-payment-method').value;
            const reference = document.getElementById('m-reference').value.trim();
            const notes = document.getElementById('m-notes').value.trim();
            const initialStatus = document.getElementById('m-initial-status').value;

            if (!userId) {
              toast.error('Por favor selecciona un usuario');
              return;
            }

            if (!amount || amount <= 0) {
              toast.error('Por favor ingresa un monto válido mayor a $0');
              return;
            }

            const btn = e.target;
            btn.disabled = true;
            btn.textContent = 'Guardando...';

            const res = await walletService.createManualRequest({
              userId,
              userName,
              requestType,
              amount,
              paymentMethod,
              reference,
              notes,
              initialStatus
            });

            if (res.success) {
              toast.success('¡Solicitud manual registrada exitosamente en wallet_requests!');
              m.close();
              await this.refreshAllData();
            } else {
              toast.error('Error: ' + (res.error || 'No se pudo crear la solicitud'));
              btn.disabled = false;
              btn.textContent = 'Crear Solicitud';
            }
          }
        }
      ]
    });
  }

  async refreshAllData() {
    await this.loadData();
    if (this.rechargesTable) this.rechargesTable.setData(this.recharges);
    if (this.withdrawalsTable) this.withdrawalsTable.setData(this.withdrawals);
    if (this.meatTable) this.meatTable.setData(this.meatRequests);
    if (this.transactionsTable) this.transactionsTable.setData(this.transactions);
    this.updatePendingCount();
  }

  updatePendingCount() {
    const pendingRecharges = this.recharges.filter(r => r.status === 'pending').length;
    const pendingWithdrawals = this.withdrawals.filter(w => w.status === 'pending').length;
    const pendingMeat = this.meatRequests.filter(m => m.status === 'pending').length;
    store.setPendingCounts({ recharges: pendingRecharges, withdrawals: pendingWithdrawals, meat: pendingMeat });

    // Actualizar badges en las pestañas
    if (this.container) {
      const recBtn = this.container.querySelector('[data-tab="recharges"]');
      const withBtn = this.container.querySelector('[data-tab="withdrawals"]');
      const meatBtn = this.container.querySelector('[data-tab="meat"]');

      if (recBtn) {
        recBtn.innerHTML = `${icons.download} <span>Comprobantes de Recarga</span> ${pendingRecharges > 0 ? `<span class="badge badge-danger" style="margin-left: 4px;">${pendingRecharges}</span>` : ''}`;
      }
      if (withBtn) {
        withBtn.innerHTML = `${icons.upload} <span>Retiros de Dinero</span> ${pendingWithdrawals > 0 ? `<span class="badge badge-warning" style="margin-left: 4px;">${pendingWithdrawals}</span>` : ''}`;
      }
      if (meatBtn) {
        meatBtn.innerHTML = `${icons.meat} <span>Retiros de Carne (Gourmet)</span> ${pendingMeat > 0 ? `<span class="badge badge-info" style="margin-left: 4px;">${pendingMeat}</span>` : ''}`;
      }
    }
  }
}
