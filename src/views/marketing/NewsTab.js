/* ==========================================================================
   MARKETING - TAB 1: BANNERS (news_billboard)
   ========================================================================== */

import { marketingService } from '../../services/marketingService.js';
import { DataTable } from '../../components/DataTable.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';

export class NewsTab {
  constructor(parentView) {
    this.parentView = parentView;
    this.dataTable = null;
  }

  render(data) {
    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar banners o enlaces...',
      actionButton: {
        text: 'Nuevo Banner',
        icon: icons.plus,
        onClick: () => this.openModal()
      },
      columns: [
        {
          header: 'Banner / Imagen',
          render: (row) => row.image_url ? `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <img src="${row.image_url}" alt="Banner" style="width: 70px; height: 38px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-color);" onerror="this.src='/piggy-icon.png'" />
              <span style="font-size: 0.75rem; color: var(--text-muted); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${row.image_url}</span>
            </div>
          ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Sin imagen</span>'
        },
        {
          header: 'URL de Acción / Enlace',
          render: (row) => row.action_url ? `
            <span style="font-family: monospace; font-size: 0.8rem; color: var(--accent-blue);">${row.action_url}</span>
          ` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Ninguno</span>'
        },
        {
          header: 'Orden',
          render: (row) => `<span class="badge badge-neutral"># ${row.sort_order ?? 0}</span>`
        },
        {
          header: 'Estado',
          render: (row) => `
            <span class="badge ${row.is_active ? 'badge-success' : 'badge-neutral'}">
              ${row.is_active ? 'Activo' : 'Pausado'}
            </span>
          `
        },
        {
          header: 'Creado',
          render: (row) => `<span style="font-size: 0.75rem; color: var(--text-muted);">${row.created_at ? new Date(row.created_at).toLocaleDateString('es-CO') : '-'}</span>`
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (row) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="toggle" title="${row.is_active ? 'Pausar' : 'Activar'}">
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
      data: data || [],
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
      marketingService.toggleNewsStatus(row.id, newStatus).then(res => {
        if (res.success) {
          row.is_active = newStatus;
          toast.success(newStatus ? 'Banner activado' : 'Banner pausado');
          this.dataTable.setData(this.parentView.dataStore.news_billboard);
        } else {
          toast.error(res.error || 'Error al cambiar estado');
        }
      });
    } else if (action === 'edit') {
      this.openModal(row);
    } else if (action === 'delete') {
      if (confirm('¿Eliminar este banner?')) {
        marketingService.deleteNews(row.id).then(res => {
          if (res.success) {
            toast.success('Banner eliminado');
            this.parentView.dataStore.news_billboard = this.parentView.dataStore.news_billboard.filter(item => item.id !== row.id);
            this.dataTable.setData(this.parentView.dataStore.news_billboard);
            this.parentView.updateBadges();
          } else {
            toast.error(res.error || 'Error al eliminar');
          }
        });
      }
    }
  }

  openModal(item = null) {
    const isEdit = Boolean(item);
    modal.open({
      title: isEdit ? 'Editar Banner' : 'Nuevo Banner',
      contentHtml: `
        <form id="news-form">
          <div class="form-group">
            <label class="form-label" for="news-image">URL de la Imagen / Banner</label>
            <input type="url" id="news-image" class="form-input" placeholder="https://ejemplo.com/banner.jpg" value="${item?.image_url || ''}" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="news-action">URL de Acción / Destino al hacer Clic</label>
            <input type="text" id="news-action" class="form-input" placeholder="/marketplace o https://..." value="${item?.action_url || ''}" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="news-order">Orden de Aparición</label>
              <input type="number" id="news-order" class="form-input" value="${item?.sort_order ?? 1}" min="0" />
            </div>

            <div class="form-group">
              <label class="form-label" for="news-active">Estado</label>
              <select id="news-active" class="form-select">
                <option value="true" ${item?.is_active !== false ? 'selected' : ''}>Activo (Visible en app)</option>
                <option value="false" ${item?.is_active === false ? 'selected' : ''}>Pausado (Oculto)</option>
              </select>
            </div>
          </div>
        </form>
      `,
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Guardar Cambios' : 'Publicar Banner',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const image_url = document.querySelector('#news-image').value.trim();
            const action_url = document.querySelector('#news-action').value.trim();
            const sort_order = document.querySelector('#news-order').value;
            const is_active = document.querySelector('#news-active').value === 'true';

            if (!image_url) {
              toast.error('Ingresa la URL de la imagen');
              return;
            }

            const payload = { image_url, action_url, sort_order: Number(sort_order), is_active };
            let res;
            if (isEdit) {
              res = await marketingService.updateNews(item.id, payload);
            } else {
              res = await marketingService.createNews(payload);
            }

            if (res.success) {
              toast.success(isEdit ? 'Banner actualizado' : 'Banner creado con éxito');
              this.parentView.dataStore.news_billboard = await marketingService.getNews();
              this.dataTable.setData(this.parentView.dataStore.news_billboard);
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
