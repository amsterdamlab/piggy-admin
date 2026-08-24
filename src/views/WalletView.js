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
    this.transactions = [];
    this.rechargesTable = null;
    this.withdrawalsTable = null;
    this.transactionsTable = null;
    this.container = null;
  }

  async render() {
    this.recharges = await walletService.getRechargeRequests();
    this.withdrawals = await walletService.getWithdrawalRequests();
    this.transactions = await walletService.getTransactions();

    const pendingRecharges = this.recharges.filter(r => r.status === 'pending').length;
    const pendingWithdrawals = this.withdrawals.filter(w => w.status === 'pending').length;
    store.setPendingCounts({ recharges: pendingRecharges, withdrawals: pendingWithdrawals });

    return `
      <div class="wallet-view">
        <div class="card">
          <div class="card-header" style="flex-direction: column; align-items: flex-start; gap: 1rem;">
            <div>
              <h2 class="card-title">${icons.wallet} Centro de Tesorería & Aprobación de Pagos</h2>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                Validación de comprobantes de depósito (Bre-B/QR) y liquidación de retiros a cuentas bancarias
              </div>
            </div>

            <div class="tabs-container" style="width: 100%; margin-bottom: 0;">
              <button class="tab-btn ${this.currentTab === 'recharges' ? 'active' : ''}" data-tab="recharges">
                📥 Comprobantes de Recarga ${pendingRecharges > 0 ? `<span class="badge badge-danger" style="margin-left: 4px;">${pendingRecharges}</span>` : ''}
              </button>
              <button class="tab-btn ${this.currentTab === 'withdrawals' ? 'active' : ''}" data-tab="withdrawals">
                📤 Solicitudes de Retiro ${pendingWithdrawals > 0 ? `<span class="badge badge-warning" style="margin-left: 4px;">${pendingWithdrawals}</span>` : ''}
              </button>
              <button class="tab-btn ${this.currentTab === 'ledger' ? 'active' : ''}" data-tab="ledger">
                📜 Libro Contable (Auditoría)
              </button>
            </div>
          </div>

          <div id="tab-wallet-recharges" style="display: ${this.currentTab === 'recharges' ? 'block' : 'none'};">
            <div id="recharges-table-wrapper">
              ${this.renderRechargesTableHtml()}
            </div>
          </div>

          <div id="tab-wallet-withdrawals" style="display: ${this.currentTab === 'withdrawals' ? 'block' : 'none'};">
            <div id="withdrawals-table-wrapper">
              ${this.renderWithdrawalsTableHtml()}
            </div>
          </div>

          <div id="tab-wallet-ledger" style="display: ${this.currentTab === 'ledger' ? 'block' : 'none'};">
            <div id="ledger-table-wrapper">
              ${this.renderLedgerTableHtml()}
            </div>
          </div>
        </div>
      </div>
    `;
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
          render: (r) => `
            <div>
              <div style="font-weight: 700;">${r.userName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${r.userPhone}</div>
              <div style="font-size: 0.72rem; color: var(--accent-green);">Saldo actual: $${r.userBalance.toLocaleString('es-CO')}</div>
            </div>
          `
        },
        {
          header: 'Monto a Acreditar',
          render: (r) => `
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--accent-green);">
              $${r.amount.toLocaleString('es-CO')}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${r.paymentMethod}</div>
          `
        },
        {
          header: 'Referencia / Voucher',
          render: (r) => `
            <div>
              <div style="font-weight: 700; font-family: monospace;">${r.referenceCode}</div>
              <button class="btn btn-secondary btn-sm" data-action="view-voucher" style="margin-top: 4px;">
                ${icons.image} Ver Comprobante
              </button>
            </div>
          `
        },
        {
          header: 'Fecha',
          render: (r) => `
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              ${new Date(r.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          `
        },
        {
          header: 'Estado',
          render: (r) => {
            if (r.status === 'pending') return `<span class="badge badge-warning">Pendiente ⚠️</span>`;
            if (r.status === 'approved') return `<span class="badge badge-success">Aprobado ✓</span>`;
            return `<span class="badge badge-danger">Rechazado ✗</span>`;
          }
        },
        {
          header: 'Acciones',
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
          render: (w) => `
            <div>
              <div style="font-weight: 700;">${w.userName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${w.userPhone}</div>
            </div>
          `
        },
        {
          header: 'Monto Solicitado',
          render: (w) => `
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--primary-pink);">
              $${w.amount.toLocaleString('es-CO')}
            </div>
            <span class="badge badge-neutral">${w.type}</span>
          `
        },
        {
          header: 'Cuenta Bancaria de Destino',
          render: (w) => `
            <div style="font-size: 0.85rem; background: var(--bg-dark); padding: 0.4rem 0.6rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); max-width: 320px;">
              ${w.bankInfo}
            </div>
          `
        },
        {
          header: 'Fecha',
          render: (w) => `
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              ${new Date(w.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          `
        },
        {
          header: 'Estado',
          render: (w) => {
            if (w.status === 'pending') return `<span class="badge badge-warning">Pendiente ⚠️</span>`;
            if (w.status === 'approved') return `<span class="badge badge-success">Transferido ✓</span>`;
            return `<span class="badge badge-danger">Rechazado ✗</span>`;
          }
        },
        {
          header: 'Acciones',
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

  renderLedgerTableHtml() {
    this.transactionsTable = new DataTable({
      searchPlaceholder: 'Buscar en el libro de transacciones...',
      columns: [
        {
          header: 'Usuario',
          render: (t) => `<div style="font-weight: 700;">${t.userName}</div>`
        },
        {
          header: 'Tipo de Movimiento',
          render: (t) => `<span class="badge badge-info">${t.type}</span>`
        },
        {
          header: 'Monto (COP)',
          render: (t) => `
            <div style="font-weight: 800; color: ${t.amount >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};">
              ${t.amount >= 0 ? '+' : ''}$${Math.abs(t.amount).toLocaleString('es-CO')}
            </div>
          `
        },
        {
          header: 'Descripción / Auditoría',
          render: (t) => `<div style="font-size: 0.8rem; color: var(--text-secondary);">${t.description}</div>`
        },
        {
          header: 'Fecha',
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

    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    if (this.rechargesTable) {
      this.rechargesTable.attachEvents(container.querySelector('#recharges-table-wrapper'));
    }
    if (this.withdrawalsTable) {
      this.withdrawalsTable.attachEvents(container.querySelector('#withdrawals-table-wrapper'));
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
    const ledEl = this.container.querySelector('#tab-wallet-ledger');

    if (recEl) recEl.style.display = tab === 'recharges' ? 'block' : 'none';
    if (withEl) withEl.style.display = tab === 'withdrawals' ? 'block' : 'none';
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
                ? `<img src="${r.receiptUrl}" alt="Comprobante" style="max-width: 100%; border-radius: var(--radius-sm);" onerror="this.parentElement.innerHTML='<div style=\\'padding: 3rem; color: var(--text-muted);\\'>⚠️ Imagen no disponible o enlace expirado</div>';" />`
                : `<div style="padding: 3rem; color: var(--text-muted);">No se adjuntó imagen en esta solicitud</div>`
              }
            </div>
            <div style="width: 100%; display: flex; justify-content: space-between; font-size: 0.9rem; background: var(--bg-dark); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
              <div>Monto: <strong>$${r.amount.toLocaleString('es-CO')} COP</strong></div>
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

  updatePendingCount() {
    const pendingRecharges = this.recharges.filter(r => r.status === 'pending').length;
    const pendingWithdrawals = this.withdrawals.filter(w => w.status === 'pending').length;
    store.setPendingCounts({ recharges: pendingRecharges, withdrawals: pendingWithdrawals });
  }
}
