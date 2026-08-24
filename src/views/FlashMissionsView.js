import { missionsService } from '../services/missionsService.js';
import { DataTable } from '../components/DataTable.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { icons } from '../icons.js';

export class FlashMissionsView {
  constructor() {
    this.dataTable = null;
    this.campaigns = [];
  }

  async render() {
    this.campaigns = await missionsService.getCampaigns();

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar misiones...',
      actionButton: {
        text: 'Nueva Misión Flash',
        icon: icons.plus,
        onClick: () => this.openCampaignModal()
      },
      columns: [
        {
          header: 'Misión / Campaña',
          render: (c) => `
            <div>
              <div style="font-weight: 800; color: var(--text-primary);">${c.title}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${c.description}</div>
            </div>
          `
        },
        {
          header: 'Recompensa',
          render: (c) => `
            <div>
              <div style="font-weight: 800; color: var(--accent-gold);">⭐ ${c.rewardPoints} pts</div>
              ${c.rewardBonusRoi > 0 
                ? `<div style="font-size: 0.72rem; color: var(--accent-green); font-weight: 700;">+${(c.rewardBonusRoi * 100).toFixed(1)}% ROI Extra</div>` 
                : ''
              }
            </div>
          `
        },
        {
          header: 'Acción Objetivo',
          render: (c) => `<span class="badge badge-info">${c.targetAction}</span>`
        },
        {
          header: 'Vigencia',
          render: (c) => `
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              <div>De: ${new Date(c.startDate).toLocaleDateString('es-CO')}</div>
              <div>A: ${c.endDate ? new Date(c.endDate).toLocaleDateString('es-CO') : 'Indefinida'}</div>
            </div>
          `
        },
        {
          header: 'Estado',
          render: (c) => `
            <span class="badge ${c.isActive ? 'badge-success' : 'badge-neutral'}">
              ${c.isActive ? 'Activa ⚡' : 'Pausada'}
            </span>
          `
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (c) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="toggle-status" title="${c.isActive ? 'Pausar' : 'Activar'}">
                ${c.isActive ? 'Pausar' : 'Activar'}
              </button>
              <button class="btn btn-secondary btn-sm" data-action="delete-campaign" style="color: var(--accent-red);" title="Eliminar">
                ${icons.trash}
              </button>
            </div>
          `
        }
      ],
      data: this.campaigns,
      onRowAction: (action, c) => this.handleAction(action, c)
    });

    return `
      <div class="flash-missions-view">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">${icons.zap} Misiones Flash & Gamificación</h2>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                Creación y control de retos temporales, bonos de alimentación y misiones comunitarias
              </div>
            </div>
            <div>
              <span class="badge badge-warning">Activas: ${this.campaigns.filter(c => c.isActive).length}</span>
            </div>
          </div>

          <div id="missions-datatable-container">
            ${this.dataTable.render()}
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    if (this.dataTable) {
      this.dataTable.attachEvents(container.querySelector('#missions-datatable-container'));
    }
  }

  handleAction(action, campaign) {
    if (action === 'toggle-status') {
      const newStatus = !campaign.isActive;
      missionsService.toggleCampaignStatus(campaign.id, newStatus).then(res => {
        if (res.success) {
          campaign.isActive = newStatus;
          toast.success(newStatus ? 'Misión activada' : 'Misión pausada');
          this.dataTable.setData(this.campaigns);
        } else {
          toast.error(res.error || 'Error al cambiar estado');
        }
      });
    } else if (action === 'delete-campaign') {
      if (confirm(`¿Eliminar la misión "${campaign.title}"?`)) {
        missionsService.deleteCampaign(campaign.id).then(res => {
          if (res.success) {
            toast.success('Misión eliminada');
            this.campaigns = this.campaigns.filter(c => c.id !== campaign.id);
            this.dataTable.setData(this.campaigns);
          } else {
            toast.error(res.error || 'Error al eliminar');
          }
        });
      }
    }
  }

  openCampaignModal() {
    modal.open({
      title: 'Crear Nueva Misión Flash ⚡',
      contentHtml: `
        <form id="mission-form">
          <div class="form-group">
            <label class="form-label" for="m-title">Título de la Misión</label>
            <input type="text" id="m-title" class="form-input" placeholder="Ej: ⚡ Flash: Alimenta a tu Piggy hoy" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="m-desc">Descripción / Instrucciones</label>
            <textarea id="m-desc" class="form-textarea" placeholder="Explica a los usuarios cómo completar esta misión..." required></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="m-points">Puntos de Recompensa</label>
              <input type="number" id="m-points" class="form-input" value="50" step="10" min="0" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="m-roi">Bono ROI Opcional (ej: 0.005 = +0.5%)</label>
              <input type="number" id="m-roi" class="form-input" value="0.00" step="0.001" min="0" />
            </div>

            <div class="form-group">
              <label class="form-label" for="m-action">Acción Requerida</label>
              <select id="m-action" class="form-select">
                <option value="check_in">Check-in Diario (Alimentar)</option>
                <option value="purchase">Compra de Piggy</option>
                <option value="referral">Referir un amigo</option>
                <option value="social_share">Compartir en Redes</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="m-start">Fecha Inicio</label>
              <input type="datetime-local" id="m-start" class="form-input" value="${new Date().toISOString().slice(0, 16)}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="m-end">Fecha Fin (Vigencia)</label>
              <input type="datetime-local" id="m-end" class="form-input" />
            </div>
          </div>
        </form>
      `,
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: 'Lanzar Misión Flash',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const title = document.querySelector('#m-title').value.trim();
            const description = document.querySelector('#m-desc').value.trim();
            const rewardPoints = document.querySelector('#m-points').value;
            const rewardBonusRoi = document.querySelector('#m-roi').value;
            const targetAction = document.querySelector('#m-action').value;
            const startDate = document.querySelector('#m-start').value;
            const endDate = document.querySelector('#m-end').value;

            if (!title || !description) {
              toast.error('Completa los campos obligatorios');
              return;
            }

            const payload = {
              title,
              description,
              rewardPoints: Number(rewardPoints),
              rewardBonusRoi: Number(rewardBonusRoi),
              targetAction,
              startDate: new Date(startDate).toISOString(),
              endDate: endDate ? new Date(endDate).toISOString() : null,
              isActive: true
            };

            const res = await missionsService.createCampaign(payload);
            if (res.success) {
              toast.success('¡Misión Flash creada y publicada!');
              this.campaigns = await missionsService.getCampaigns();
              this.dataTable.setData(this.campaigns);
              m.close();
            } else {
              toast.error(res.error || 'Error al crear misión');
            }
          }
        }
      ]
    });
  }
}
