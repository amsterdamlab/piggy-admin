import { usersService } from '../services/usersService.js';
import { DataTable } from '../components/DataTable.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { icons } from '../icons.js';

export class UsersView {
  constructor() {
    this.dataTable = null;
    this.users = [];
  }

  async render() {
    this.users = await usersService.getUsers();

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar por nombre, email o WhatsApp...',
      columns: [
        {
          header: 'Usuario / Contacto',
          render: (u) => `
            <div>
              <div style="font-weight: 700; color: var(--text-primary);">${u.fullName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 0.5rem; margin-top: 2px;">
                <span>📱 ${u.whatsapp}</span>
                <span>✉️ ${u.email}</span>
              </div>
            </div>
          `
        },
        {
          header: 'Legal',
          render: (u) => `
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              <span class="badge ${u.termsAccepted ? 'badge-success' : 'badge-danger'}">
                ${u.termsAccepted ? 'Términos ✓' : 'Términos ✗'}
              </span>
              <span class="badge ${u.habeasDataAccepted ? 'badge-success' : 'badge-danger'}">
                ${u.habeasDataAccepted ? 'Habeas ✓' : 'Habeas ✗'}
              </span>
            </div>
          `
        },
        {
          header: 'Saldo Billetera',
          render: (u) => `
            <div style="font-weight: 800; color: var(--accent-green);">
              $${u.balance.toLocaleString('es-CO')}
            </div>
            <div style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 600;">
              ⭐ ${u.points} pts
            </div>
          `
        },
        {
          header: 'Inversión & Piggies',
          render: (u) => `
            <div>
              <div style="font-weight: 700; color: var(--primary-pink);">${u.activePiggies} Cerditos</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">$${u.totalInvested.toLocaleString('es-CO')} COP</div>
            </div>
          `
        },
        {
          header: 'Registro',
          render: (u) => `
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              ${new Date(u.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          `
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (u) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="adjust-balance" title="Modificar Saldo">
                ${icons.dollar} Saldo
              </button>
              <button class="btn btn-secondary btn-sm" data-action="view-detail" title="Ver Detalle">
                ${icons.eye}
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
                Administración de perfiles, estados de aceptación legal y saldos de billetera
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
    if (action === 'adjust-balance') {
      this.openAdjustBalanceModal(user);
    } else if (action === 'view-detail') {
      this.openUserDetailModal(user);
    }
  }

  openAdjustBalanceModal(user) {
    modal.open({
      title: `Ajustar Saldo: ${user.fullName}`,
      contentHtml: `
        <form id="adjust-balance-form">
          <div class="form-group">
            <label class="form-label">Saldo Actual</label>
            <input type="text" class="form-input" value="$${user.balance.toLocaleString('es-CO')}" disabled />
          </div>

          <div class="form-group">
            <label class="form-label" for="new-balance-input">Nuevo Saldo (COP)</label>
            <input 
              type="number" 
              id="new-balance-input" 
              class="form-input" 
              placeholder="Ej: 1500000" 
              value="${user.balance}" 
              required 
              min="0"
              step="1000"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="adjust-reason-input">Motivo del Ajuste (Auditoría)</label>
            <input 
              type="text" 
              id="adjust-reason-input" 
              class="form-input" 
              placeholder="Ej: Bonificación de bienvenida / Corrección manual" 
              value="Ajuste manual de Administrador" 
              required
            />
          </div>
        </form>
      `,
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: 'Guardar Saldo',
          class: 'btn-success',
          onClick: async (e, m) => {
            const newBal = document.querySelector('#new-balance-input').value;
            const reason = document.querySelector('#adjust-reason-input').value;

            if (newBal === '') {
              toast.error('Por favor ingresa un saldo válido');
              return;
            }

            const res = await usersService.adjustBalance(user.id, Number(newBal), reason);
            if (res.success) {
              toast.success('Saldo actualizado exitosamente');
              user.balance = Number(newBal);
              this.dataTable.setData(this.users);
              m.close();
            } else {
              toast.error(res.error || 'Error al actualizar saldo');
            }
          }
        }
      ]
    });
  }

  openUserDetailModal(user) {
    modal.open({
      title: `Detalle del Usuario: ${user.fullName}`,
      contentHtml: `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="background: var(--bg-dark); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.8rem; color: var(--text-muted);">Información de Contacto</div>
            <div style="font-size: 1.1rem; font-weight: 800; margin-top: 0.2rem;">${user.fullName}</div>
            <div style="display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap;">
              <div>📱 <strong>WhatsApp:</strong> ${user.whatsapp}</div>
              <div>✉️ <strong>Email:</strong> ${user.email}</div>
            </div>
            <div style="margin-top: 0.8rem;">
              <a href="https://wa.me/${user.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-sm btn-success">
                Abrir Chat de WhatsApp
              </a>
            </div>
          </div>

          <div class="form-row">
            <div style="background: var(--bg-dark); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 0.75rem; color: var(--text-muted);">Saldo Billetera</div>
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--accent-green);">$${user.balance.toLocaleString('es-CO')}</div>
            </div>

            <div style="background: var(--bg-dark); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 0.75rem; color: var(--text-muted);">Puntos Gamificación</div>
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--accent-gold);">${user.points} pts</div>
            </div>

            <div style="background: var(--bg-dark); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
              <div style="font-size: 0.75rem; color: var(--text-muted);">Piggies en Engorde</div>
              <div style="font-size: 1.2rem; font-weight: 800; color: var(--primary-pink);">${user.activePiggies} Cerditos</div>
            </div>
          </div>

          <div style="background: var(--bg-dark); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">Cumplimiento Normativo (Colombia)</div>
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
      footerButtons: [
        { text: 'Cerrar', class: 'btn-secondary', onClick: (e, m) => m.close() }
      ]
    });
  }
}
