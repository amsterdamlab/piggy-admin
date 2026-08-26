/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - PIGGIES FARM VIEW
   ========================================================================== */

import { piggiesService } from '../services/piggiesService.js';
import { usersService } from '../services/usersService.js';
import { DataTable } from '../components/DataTable.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { icons } from '../icons.js';

export class PiggiesView {
  constructor() {
    this.dataTable = null;
    this.piggies = [];
  }

  async render() {
    this.piggies = await piggiesService.getPiggies('all');

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar por cerdito, dueño o ID...',
      filters: [
        { label: 'En Engorde', value: 'engorde' },
        { label: 'Completados', value: 'completado' },
        { label: 'Liquidados', value: 'liquidado' }
      ],
      actionButton: {
        text: 'Asignar Piggy Manual',
        icon: icons.plus,
        onClick: () => this.openCreatePiggyModal()
      },
      columns: [
        {
          header: 'Cerdito / Lote',
          render: (p) => `
            <div>
              <div style="font-weight: 800; color: var(--primary-pink);">${p.name}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">ID: ${p.id.substring(0, 8)}...</div>
            </div>
          `
        },
        {
          header: 'Dueño / Contacto',
          render: (p) => `
            <div>
              <div style="font-weight: 700;">${p.userName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${p.userPhone}</div>
            </div>
          `
        },
        {
          header: 'Peso Actual',
          render: (p) => `
            <div style="font-weight: 800; color: var(--accent-gold); font-size: 1rem;">
              ${p.currentWeight} kg
            </div>
          `
        },
        {
          header: 'Inversión & Retorno',
          render: (p) => `
            <div>
              <div style="font-weight: 700;">$${p.investmentAmount.toLocaleString('es-CO')}</div>
              <div style="font-size: 0.75rem; color: var(--accent-green); font-weight: 700;">
                ${p.extraRoiBonus > 0 ? `+${(p.extraRoiBonus * 100).toFixed(1)}% Bono Extra` : 'ROI Estándar'}
              </div>
            </div>
          `
        },
        {
          header: 'Estado',
          render: (p) => {
            let badgeClass = 'badge-warning';
            let label = 'En Engorde';
            if (p.status === 'completado') {
              badgeClass = 'badge-success';
              label = 'Listo para Liquidar';
            } else if (p.status === 'liquidado') {
              badgeClass = 'badge-neutral';
              label = 'Liquidado';
            }
            return `<span class="badge ${badgeClass}">${label}</span>`;
          }
        },
        {
          header: 'Liquidación',
          render: (p) => `
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              ${p.endDate ? new Date(p.endDate).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : '19 semanas'}
            </div>
          `
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (p) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="edit-piggy" title="Editar Pesaje y Estado">
                ${icons.edit} <span>Editar</span>
              </button>
              <button class="btn btn-secondary btn-sm" data-action="delete-piggy" style="color: var(--accent-red);" title="Eliminar">
                ${icons.trash}
              </button>
            </div>
          `
        }
      ],
      data: this.piggies,
      onRowAction: (action, piggy) => this.handleAction(action, piggy)
    });

    return `
      <div class="piggies-view">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">${icons.pig} Granja de Piggys (Supervisión de Engorde)</h2>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                Control de pesaje semanal, bonos de aceleración y estados del ciclo biológico
              </div>
            </div>
            <div>
              <span class="badge badge-success">Activos: ${this.piggies.filter(p => p.status === 'engorde').length}</span>
            </div>
          </div>

          <div id="piggies-datatable-container">
            ${this.dataTable.render()}
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    if (this.dataTable) {
      this.dataTable.attachEvents(container.querySelector('#piggies-datatable-container'));
    }
  }

  handleAction(action, piggy) {
    if (action === 'edit-piggy') {
      this.openEditPiggyModal(piggy);
    } else if (action === 'delete-piggy') {
      if (confirm(`¿Estás seguro de eliminar el cerdito "${piggy.name}"?`)) {
        this.deletePiggy(piggy.id);
      }
    }
  }

  openEditPiggyModal(piggy) {
    modal.open({
      title: `Editar Pesaje y Estado: ${piggy.name}`,
      contentHtml: `
        <form id="edit-piggy-form">
          <div class="form-group">
            <label class="form-label">Dueño Asignado</label>
            <input type="text" class="form-input" value="${piggy.userName} (${piggy.userPhone})" disabled />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="edit-weight-input">Peso Actual (kg)</label>
              <input 
                type="number" 
                id="edit-weight-input" 
                class="form-input" 
                step="0.1" 
                min="10" 
                max="160" 
                value="${piggy.currentWeight}" 
                required 
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="edit-roi-input">Bono Extra ROI (ej: 0.02 = +2%)</label>
              <input 
                type="number" 
                id="edit-roi-input" 
                class="form-input" 
                step="0.005" 
                min="0" 
                max="0.1" 
                value="${piggy.extraRoiBonus}" 
                required 
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="edit-status-select">Estado del Ciclo</label>
              <select id="edit-status-select" class="form-select">
                <option value="engorde" ${piggy.status === 'engorde' ? 'selected' : ''}>En Engorde (Activo)</option>
                <option value="completado" ${piggy.status === 'completado' ? 'selected' : ''}>Completado (Listo para liquidar)</option>
                <option value="liquidado" ${piggy.status === 'liquidado' ? 'selected' : ''}>Liquidado (Finalizado)</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="edit-name-input">Nombre o Etiqueta</label>
              <input type="text" id="edit-name-input" class="form-input" value="${piggy.name}" required />
            </div>
          </div>
        </form>
      `,
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: 'Guardar Cambios',
          class: 'btn-success',
          onClick: async (e, m) => {
            const weight = document.querySelector('#edit-weight-input').value;
            const roi = document.querySelector('#edit-roi-input').value;
            const status = document.querySelector('#edit-status-select').value;
            const name = document.querySelector('#edit-name-input').value;

            const res = await piggiesService.updatePiggy(piggy.id, {
              currentWeight: Number(weight),
              extraRoiBonus: Number(roi),
              status,
              name
            });

            if (res.success) {
              toast.success('Pesaje y estado actualizados correctamente');
              piggy.currentWeight = Number(weight);
              piggy.extraRoiBonus = Number(roi);
              piggy.status = status;
              piggy.name = name;
              this.dataTable.setData(this.piggies);
              m.close();
            } else {
              toast.error(res.error || 'Error al actualizar cerdito');
            }
          }
        }
      ]
    });
  }

  async openCreatePiggyModal() {
    const users = await usersService.getUsers();

    modal.open({
      title: 'Asignar Nuevo Piggy a Usuario',
      contentHtml: `
        <form id="create-piggy-form">
          <div class="form-group">
            <label class="form-label" for="piggy-user-select">Seleccionar Usuario Dueño</label>
            <select id="piggy-user-select" class="form-select" required>
              ${users.map(u => `<option value="${u.id}">${u.fullName} (${u.whatsapp})</option>`).join('')}
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="new-piggy-name">Nombre / Raza</label>
              <input type="text" id="new-piggy-name" class="form-input" placeholder="Ej: Piggy Landrace Premium" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="new-piggy-amount">Inversión</label>
              <input type="number" id="new-piggy-amount" class="form-input" value="1000000" step="100000" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="new-piggy-weight">Peso Inicial (kg)</label>
              <input type="number" id="new-piggy-weight" class="form-input" value="15.0" step="0.5" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="new-piggy-roi">Bono Extra ROI (ej: 0.01)</label>
              <input type="number" id="new-piggy-roi" class="form-input" value="0.00" step="0.005" />
            </div>
          </div>
        </form>
      `,
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: 'Asignar y Crear',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const userId = document.querySelector('#piggy-user-select').value;
            const name = document.querySelector('#new-piggy-name').value;
            const amount = document.querySelector('#new-piggy-amount').value;
            const weight = document.querySelector('#new-piggy-weight').value;
            const roi = document.querySelector('#new-piggy-roi').value;

            if (!name) {
              toast.error('Ingresa un nombre para el cerdito');
              return;
            }

            const res = await piggiesService.createPiggyForUser(userId, {
              name,
              investmentAmount: Number(amount),
              currentWeight: Number(weight),
              extraRoiBonus: Number(roi),
              status: 'engorde'
            });

            if (res.success) {
              toast.success('¡Piggy asignado exitosamente!');
              this.piggies = await piggiesService.getPiggies('all');
              this.dataTable.setData(this.piggies);
              m.close();
            } else {
              toast.error(res.error || 'Error al crear Piggy');
            }
          }
        }
      ]
    });
  }

  async deletePiggy(piggyId) {
    const res = await piggiesService.deletePiggy(piggyId);
    if (res.success) {
      toast.success('Piggy eliminado');
      this.piggies = this.piggies.filter(p => p.id !== piggyId);
      this.dataTable.setData(this.piggies);
    } else {
      toast.error(res.error || 'Error al eliminar');
    }
  }
}
