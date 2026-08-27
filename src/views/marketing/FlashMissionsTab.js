/* ==========================================================================
   MARKETING - MISIONES: SUB-TAB 2: MISIONES FLASH MANUALES (user_flash_missions)
   Columnas: Nombre Usuario, Misión Flash, Tipo Piggy, Precio & Oferta, Estado & Caducidad, Creación, Acciones
   ========================================================================== */

import { marketingService } from '../../services/marketingService.js';
import { DataTable } from '../../components/DataTable.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';

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
            const name = p.full_name || p.fullName || p.name || 'Inversionista';
            const email = p.email || row.user_id;
            return `
              <div>
                <div style="font-weight: 800; color: var(--text-primary); font-size: 0.9rem;">
                  ${name}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace; margin-top: 1px;">
                  ${email}
                </div>
                <div style="margin-top: 4px;">
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
              <div style="font-weight: 800; color: var(--text-primary); font-size: 0.9rem;">${row.title || row.mission_title || 'Misión Flash'}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 220px; margin-top: 2px;">${row.description || 'Sin descripción'}</div>
            </div>
          `
        },
        {
          header: 'Tipo Piggy',
          render: (row) => `
            <span class="badge badge-info" style="font-weight: 800; text-transform: uppercase; font-size: 0.75rem;">
              ${row.piggy_type || 'General'}
            </span>
          `
        },
        {
          header: 'Precio & Oferta',
          render: (row) => {
            const offerBadge = row.is_purchased === true
              ? `<div style="margin-top: 4px; display: flex; align-items: center; gap: 5px;">
                   <span class="badge badge-success" style="padding: 1px 6px; font-size: 0.7rem;">Aceptada</span>
                   ${row.purchased_at ? `<span style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">${new Date(row.purchased_at).toLocaleDateString('es-CO')}</span>` : ''}
                 </div>`
              : '<div style="margin-top: 4px;"><span class="badge badge-danger" style="padding: 1px 6px; font-size: 0.7rem;">Cancelada</span></div>';

            return `
              <div>
                <div style="font-weight: 800; color: var(--accent-gold); font-size: 0.95rem;">
                  $${Number(row.price || 0).toLocaleString('es-CO')}
                </div>
                ${offerBadge}
              </div>
            `;
          }
        },
        {
          header: 'Estado & Caducidad',
          render: (row) => `
            <div>
              <span class="badge ${row.is_active ? 'badge-success' : 'badge-neutral'}">
                ${row.is_active ? 'Activa' : 'Inactiva'}
              </span>
              <div style="font-size: 0.73rem; color: var(--text-muted); margin-top: 4px; font-family: monospace;">
                ${row.scheduled_at ? `Exp: ${new Date(row.scheduled_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}` : 'Sin caducidad'}
              </div>
            </div>
          `
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
              <button class="btn btn-secondary btn-sm" data-action="toggle" title="${row.is_active ? 'Pausar Misión' : 'Activar Misión'}">
                ${row.is_active ? 'Pausar' : 'Activar'}
              </button>
              <button class="btn btn-secondary btn-sm" data-action="edit" title="Editar">
                ${icons.edit}
              </button>
              <button class="btn btn-secondary btn-sm" data-action="delete" style="color: var(--accent-red);" title="Eliminar">
                ${icons.trash}
              </button>
            </div>
          `
        }
      ],
      data: rawData,
      onRowAction: (action, row) => this.handleAction(action, row)
    });

    return this.dataTable.render();
  }

  attachEvents(container) {
    if (this.dataTable) {
      this.dataTable.attachEvents(container);
    }
  }

  handleAction(action, row) {
    if (action === 'toggle') {
      const newStatus = !row.is_active;
      marketingService.toggleUserFlashMissionStatus(row.id, newStatus).then(res => {
        if (res.success) {
          row.is_active = newStatus;
          toast.success(newStatus ? 'Misión flash activada' : 'Misión flash pausada');
          this.dataTable.setData(this.parentView.dataStore.user_flash_missions);
        } else {
          toast.error(res.error || 'Error al cambiar estado');
        }
      });
    } else if (action === 'edit') {
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

    modal.open({
      title: `Detalle del Usuario: ${fullName}`,
      contentHtml: `
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
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
                <div style="font-weight: 700; color: var(--accent-gold);">${bankBreveKey}</div>
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

    const scheduledVal = item?.scheduled_at ? new Date(item.scheduled_at).toISOString().slice(0, 16) : '';

    modal.open({
      title: isEdit ? 'Editar Misión Flash' : 'Nueva Misión Flash',
      contentHtml: `
        <form id="flash-form">
          <div class="form-group">
            <label class="form-label" for="flash-title">Título de la Misión Flash</label>
            <input type="text" id="flash-title" class="form-input" placeholder="Ej: El Cerdito de Oro" value="${item?.title || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="flash-desc">Descripción / Instrucciones</label>
            <textarea id="flash-desc" class="form-textarea" placeholder="Explica la oferta temporal al usuario...">${item?.description || ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-user">Usuario Destinatario</label>
              <select id="flash-user" class="form-select">
                <option value="">-- Global (Todos los usuarios) --</option>
                ${userOptions}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="flash-type">Tipo de Piggy</label>
              <select id="flash-type" class="form-select">
                <option value="dorado" ${item?.piggy_type === 'dorado' ? 'selected' : ''}>Dorado</option>
                <option value="esmeralda" ${item?.piggy_type === 'esmeralda' ? 'selected' : ''}>Esmeralda</option>
                <option value="diamante" ${item?.piggy_type === 'diamante' ? 'selected' : ''}>Diamante</option>
                <option value="clasico" ${item?.piggy_type === 'clasico' ? 'selected' : ''}>Clásico</option>
                <option value="avanzado60" ${item?.piggy_type === 'avanzado60' ? 'selected' : ''}>Avanzado (60 Días)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="flash-price">Precio ($)</label>
              <input type="number" id="flash-price" class="form-input" value="${item?.price || 1000000}" step="50000" min="0" required />
            </div>

            <div class="form-group">
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
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Guardar Cambios' : 'Lanzar Misión Flash',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const title = document.querySelector('#flash-title').value.trim();
            const description = document.querySelector('#flash-desc').value.trim();
            const user_id = document.querySelector('#flash-user').value || null;
            const piggy_type = document.querySelector('#flash-type').value;
            const price = document.querySelector('#flash-price').value;
            const scheduled_at = document.querySelector('#flash-scheduled').value;
            const is_purchased = document.querySelector('#flash-purchased').value === 'true';
            const is_active = document.querySelector('#flash-active').value === 'true';

            if (!title) {
              toast.error('Ingresa el título de la misión flash');
              return;
            }

            const payload = {
              title,
              description,
              user_id,
              piggy_type,
              price: Number(price),
              scheduled_at: scheduled_at ? new Date(scheduled_at).toISOString() : null,
              is_purchased,
              purchased_at: is_purchased ? (item?.purchased_at || new Date().toISOString()) : null,
              is_active
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
