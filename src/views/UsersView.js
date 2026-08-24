/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - USERS CRM VIEW
   Comprehensive investor profiles, financial metrics & banking data
   ========================================================================== */

import { usersService } from '../services/usersService.js';
import { DataTable } from '../components/DataTable.js';
import { modal } from '../components/Modal.js';
import { icons } from '../icons.js';

export class UsersView {
  constructor() {
    this.dataTable = null;
    this.users = [];
  }

  async render() {
    this.users = await usersService.getUsers();

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar por nombre, email, WhatsApp o cédula...',
      columns: [
        {
          header: 'Usuario / Contacto',
          key: 'fullName',
          sortValue: (u) => u.fullName,
          render: (u) => `
            <div>
              <div style="font-weight: 800; color: var(--text-primary); font-size: 0.95rem;">${u.fullName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 0.75rem; margin-top: 3px; flex-wrap: wrap; align-items: center;">
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <span style="color: var(--accent-green);">${icons.phone}</span> 
                  ${u.whatsapp !== 'N/A' ? u.whatsapp : 'Sin WhatsApp'}
                </span>
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <span style="color: var(--accent-blue);">${icons.mail}</span> 
                  ${u.email}
                </span>
                ${u.cedula && u.cedula !== 'No registrada' ? `
                  <span style="display: inline-flex; align-items: center; gap: 4px;">
                    <span style="color: var(--text-secondary);">${icons.idCard}</span> 
                    CC: ${u.cedula}
                  </span>
                ` : ''}
              </div>
            </div>
          `
        },
        {
          header: 'Legal',
          sortValue: (u) => (u.termsAccepted ? 1 : 0),
          render: (u) => `
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              <span class="badge ${u.termsAccepted ? 'badge-success' : 'badge-danger'}">
                ${u.termsAccepted ? 'Términos' : 'Sin Términos'}
              </span>
              <span class="badge ${u.habeasDataAccepted ? 'badge-success' : 'badge-danger'}">
                ${u.habeasDataAccepted ? 'Habeas Data' : 'Sin Habeas'}
              </span>
            </div>
          `
        },
        {
          header: 'Saldo Billetera',
          key: 'walletBalance',
          sortValue: (u) => u.walletBalance,
          render: (u) => `
            <div>
              <div style="font-weight: 800; color: var(--accent-green); font-size: 1rem;">
                $${u.walletBalance.toLocaleString('es-CO')}
              </div>
              ${u.bonosConsumo > 0 ? `
                <div style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 700; margin-top: 2px; display: flex; align-items: center; gap: 3px;">
                  <span>${icons.tag}</span> $${u.bonosConsumo.toLocaleString('es-CO')} Bonos Consumo
                </div>
              ` : ''}
            </div>
          `
        },
        {
          header: 'Inversión & Piggies',
          key: 'totalCompraPiggies',
          sortValue: (u) => u.totalCompraPiggies,
          render: (u) => `
            <div>
              <div style="font-weight: 800; color: var(--primary-pink);">
                ${u.activePiggiesCount} en engorde <span style="font-weight: 500; color: var(--text-muted); font-size: 0.8rem;">(${u.totalPiggiesCount} total)</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                Compra: $${u.totalCompraPiggies.toLocaleString('es-CO')}
              </div>
            </div>
          `
        },
        {
          header: 'Registro',
          key: 'createdAt',
          sortValue: (u) => new Date(u.createdAt).getTime(),
          render: (u) => `
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              ${new Date(u.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          `
        },
        {
          header: 'Acciones',
          sortable: false,
          style: 'text-align: right;',
          render: (u) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="view-detail" title="Ver Detalle Completo">
                ${icons.eye} <span>Ver Detalle</span>
              </button>
            </div>
          `
        }
      ],
      data: this.users,
      onRowAction: (action, user) => this.handleAction(action, user)
    });

    return `
      <div class="users-view">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">${icons.users} CRM de Inversionistas y Usuarios</h2>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                Administración integral de perfiles, compras de cerditos, datos bancarios y solicitudes de tesorería
              </div>
            </div>
            <div>
              <span class="badge badge-info">Total: ${this.users.length} Usuarios</span>
            </div>
          </div>

          <div id="users-datatable-container">
            ${this.dataTable.render()}
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    if (this.dataTable) {
      this.dataTable.attachEvents(container.querySelector('#users-datatable-container'));
    }
  }

  handleAction(action, user) {
    if (action === 'view-detail') {
      this.openUserDetailModal(user);
    }
  }

  openUserDetailModal(user) {
    const cleanPhone = user.whatsapp ? user.whatsapp.replace(/[^0-9]/g, '') : '';
    const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('57') ? cleanPhone : '57' + cleanPhone}` : null;

    modal.open({
      title: `Detalle del Inversionista: ${user.fullName}`,
      size: 'large',
      contentHtml: `
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- 1. INFORMACIÓN DE CONTACTO & BANCARIA -->
          <div style="background: var(--bg-dark); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">
                  Información de Contacto & Identificación
                </div>
                <div style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin-top: 0.2rem;">
                  ${user.fullName}
                </div>
              </div>

              ${waLink ? `
                <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-success" style="padding: 0.4rem 0.85rem; display: inline-flex; align-items: center; gap: 6px;">
                  ${icons.phone} <span>Abrir Chat de WhatsApp</span>
                </a>
              ` : ''}
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.85rem; margin-top: 1rem; font-size: 0.85rem;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: var(--accent-green);">${icons.phone}</span>
                <span style="color: var(--text-muted);">WhatsApp:</span> 
                <strong style="color: var(--text-primary);">${user.whatsapp}</strong>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: var(--accent-blue);">${icons.mail}</span>
                <span style="color: var(--text-muted);">Email:</span> 
                <strong style="color: var(--text-primary);">${user.email}</strong>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: var(--text-secondary);">${icons.idCard}</span>
                <span style="color: var(--text-muted);">Cédula:</span> 
                <strong style="color: var(--text-primary);">${user.cedula}</strong>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: var(--primary-pink);">${icons.building}</span>
                <span style="color: var(--text-muted);">Banco:</span> 
                <strong style="color: var(--text-primary);">${user.bankName}</strong>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: var(--accent-gold);">${icons.creditCard}</span>
                <span style="color: var(--text-muted);">Tipo & Cuenta:</span> 
                <strong style="color: var(--text-primary);">${user.bankAccountType ? `${user.bankAccountType} - ${user.bankAccountNumber}` : (user.bankAccountNumber || 'No registrada')}</strong>
              </div>
              ${user.bankBreveKey ? `
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: var(--accent-purple);">${icons.zap}</span>
                  <span style="color: var(--text-muted);">Llave Bre-B:</span> 
                  <strong style="color: var(--accent-gold);">${user.bankBreveKey}</strong>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- 2. MÉTRICAS FINANCIERAS Y DE GRANJA -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
            
            <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--accent-green);">${icons.wallet}</span> Saldo Disponible en Billetera
              </div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-green); margin-top: 0.3rem;">
                $${user.walletBalance.toLocaleString('es-CO')}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                Disponible para retiros o compras
              </div>
            </div>

            <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--accent-gold);">${icons.tag}</span> Bonos de Consumo Disponibles
              </div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-gold); margin-top: 0.3rem;">
                $${user.bonosConsumo.toLocaleString('es-CO')}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                Para canjes en Piggy Gourmet & Aliados
              </div>
            </div>

            <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--primary-pink);">${icons.pig}</span> Valor de Compra Piggys
              </div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary-pink); margin-top: 0.3rem;">
                $${user.totalCompraPiggies.toLocaleString('es-CO')}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                Capital total invertido en cerditos
              </div>
            </div>

            <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--accent-blue);">${icons.trendingUp}</span> Margen Comercial en Granja
              </div>
              <div style="font-size: 1.3rem; font-weight: 800; color: var(--accent-blue); margin-top: 0.3rem;">
                ${user.margenComercialLabel}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                Rendimiento pactado por lote
              </div>
            </div>

            <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--accent-green);">${icons.target}</span> Valor de Referencia en Mercado
              </div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--accent-green); margin-top: 0.3rem;">
                +$${user.valorReferenciaMercado.toLocaleString('es-CO')}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                Beneficio total ganado o por liquidar
              </div>
            </div>

            <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; display: flex; align-items: center; gap: 4px;">
                <span style="color: var(--primary-pink);">${icons.pig}</span> Piggies en Granja
              </div>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-top: 0.3rem;">
                ${user.activePiggiesCount} <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">/ ${user.totalPiggiesCount} total</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">
                ${user.activePiggiesCount} en engorde activo
              </div>
            </div>

          </div>

          <!-- 3. SOLICITUDES DE TESORERÍA PENDIENTES (ACCESO RÁPIDO) -->
          <div style="background: var(--bg-dark); padding: 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-bottom: 0.6rem;">
              Estado de Solicitudes en Tesorería
            </div>

            ${(user.pendingRecharges > 0 || user.pendingWithdrawals > 0) ? `
              <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
                ${user.pendingRecharges > 0 ? `
                  <div style="background: rgba(255, 184, 0, 0.12); border: 1px solid var(--accent-gold); padding: 0.75rem 1rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex: 1;">
                    <div>
                      <div style="font-weight: 700; color: var(--accent-gold); display: flex; align-items: center; gap: 4px;">
                        ${icons.alertTriangle} Tiene ${user.pendingRecharges} recarga(s) pendiente(s)
                      </div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">Comprobante Bre-B / QR por validar</div>
                    </div>
                    <button class="btn btn-sm btn-primary" id="btn-go-recharges">
                      ${icons.download} <span>Aprobar Recarga</span>
                    </button>
                  </div>
                ` : ''}

                ${user.pendingWithdrawals > 0 ? `
                  <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid var(--accent-red); padding: 0.75rem 1rem; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex: 1;">
                    <div>
                      <div style="font-weight: 700; color: var(--accent-red); display: flex; align-items: center; gap: 4px;">
                        ${icons.alertTriangle} Tiene ${user.pendingWithdrawals} retiro(s) pendiente(s)
                      </div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">Transferencia bancaria por liquidar</div>
                    </div>
                    <button class="btn btn-sm btn-primary" id="btn-go-withdrawals">
                      ${icons.upload} <span>Liquidar Retiro</span>
                    </button>
                  </div>
                ` : ''}
              </div>
            ` : `
              <div style="font-size: 0.85rem; color: var(--accent-green); font-weight: 600; display: flex; align-items: center; gap: 0.4rem;">
                <span style="color: var(--accent-green);">${icons.check}</span>
                <span>Al día: No tiene solicitudes pendientes de recarga o retiro en tesorería.</span>
              </div>
            `}
          </div>

          <!-- 4. CUMPLIMIENTO NORMATIVO -->
          <div style="background: var(--bg-dark); padding: 0.9rem 1.1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
              ${icons.shieldCheck} Cumplimiento Normativo (Colombia):
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <span class="badge ${user.termsAccepted ? 'badge-success' : 'badge-danger'}">
                ${user.termsAccepted ? 'Términos y Condiciones Aceptados' : 'Términos Pendientes'}
              </span>
              <span class="badge ${user.habeasDataAccepted ? 'badge-success' : 'badge-danger'}">
                ${user.habeasDataAccepted ? 'Ley 1581 Habeas Data Aceptado' : 'Habeas Data Pendiente'}
              </span>
            </div>
          </div>

        </div>
      `,
      onInit: (modalBody, m) => {
        const goRecharges = modalBody.querySelector('#btn-go-recharges');
        const goWithdrawals = modalBody.querySelector('#btn-go-withdrawals');

        if (goRecharges) {
          goRecharges.addEventListener('click', () => {
            m.close();
            window.location.hash = '#wallet';
          });
        }

        if (goWithdrawals) {
          goWithdrawals.addEventListener('click', () => {
            m.close();
            window.location.hash = '#wallet';
          });
        }
      },
      footerButtons: [
        { text: 'Cerrar', class: 'btn-secondary', onClick: (e, m) => m.close() }
      ]
    });
  }
}
