import { marketplaceService } from '../services/marketplaceService.js';
import { DataTable } from '../components/DataTable.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { icons } from '../icons.js';

export class MarketplaceView {
  constructor() {
    this.dataTable = null;
    this.items = [];
  }

  async render() {
    this.items = await marketplaceService.getItems();

    this.dataTable = new DataTable({
      searchPlaceholder: 'Buscar en el catálogo...',
      actionButton: {
        text: 'Nuevo Cerdito / Acelerador',
        icon: icons.plus,
        onClick: () => this.openItemModal()
      },
      columns: [
        {
          header: 'Imagen',
          render: (item) => `
            <div style="width: 48px; height: 48px; border-radius: var(--radius-md); overflow: hidden; background: var(--bg-dark); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center;">
              ${item.imageUrl 
                ? `<img src="${item.imageUrl}" alt="${item.itemName}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='https://placehold.co/100x100/151B28/FF4B8B?text=Piggy';" />`
                : `<span style="font-size: 1.5rem;">🐖</span>`
              }
            </div>
          `
        },
        {
          header: 'Producto / Acelerador',
          render: (item) => `
            <div>
              <div style="font-weight: 800; color: var(--text-primary);">${item.itemName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''}</div>
            </div>
          `
        },
        {
          header: 'Categoría & Bono',
          render: (item) => `
            <div>
              <span class="badge ${item.extraRoi > 0 ? 'badge-warning' : 'badge-neutral'}">
                ${item.badge}
              </span>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${item.category}</div>
            </div>
          `
        },
        {
          header: 'Precio (COP)',
          render: (item) => `
            <div style="font-weight: 800; color: var(--accent-green);">
              $${item.price.toLocaleString('es-CO')}
            </div>
          `
        },
        {
          header: 'Stock',
          render: (item) => `
            <div style="font-weight: 700; color: ${item.stock <= 5 ? 'var(--accent-red)' : 'var(--text-primary)'};">
              ${item.stock} unidades
            </div>
          `
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (item) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="edit-item" title="Editar Producto">
                ${icons.edit}
              </button>
              <button class="btn btn-secondary btn-sm" data-action="delete-item" style="color: var(--accent-red);" title="Eliminar">
                ${icons.trash}
              </button>
            </div>
          `
        }
      ],
      data: this.items,
      onRowAction: (action, item) => this.handleAction(action, item)
    });

    return `
      <div class="marketplace-view">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">${icons.marketplace} Catálogo del Mercado de Cerditos</h2>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                Administración de ofertas, aceleradores (+1%, +2% ROI) e inventario disponible
              </div>
            </div>
            <div>
              <span class="badge badge-info">Total: ${this.items.length} Ofertas</span>
            </div>
          </div>

          <div id="marketplace-datatable-container">
            ${this.dataTable.render()}
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(container) {
    if (this.dataTable) {
      this.dataTable.attachEvents(container.querySelector('#marketplace-datatable-container'));
    }
  }

  handleAction(action, item) {
    if (action === 'edit-item') {
      this.openItemModal(item);
    } else if (action === 'delete-item') {
      if (confirm(`¿Estás seguro de eliminar la oferta "${item.itemName}"?`)) {
        this.deleteItem(item.id);
      }
    }
  }

  openItemModal(item = null) {
    const isEdit = !!item;
    const initial = item || {
      itemName: '',
      description: '',
      price: 1000000,
      extraRoi: 0.01,
      stock: 10,
      imageUrl: '',
      category: 'Acelerador Gold'
    };

    modal.open({
      title: isEdit ? `Editar Oferta: ${initial.itemName}` : 'Crear Nueva Oferta de Mercado',
      contentHtml: `
        <form id="marketplace-item-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="mk-name">Nombre del Producto</label>
              <input type="text" id="mk-name" class="form-input" placeholder="Ej: Piggy Pietrain +2% ROI" value="${initial.itemName}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="mk-category">Categoría</label>
              <select id="mk-category" class="form-select">
                <option value="Acelerador Gold" ${initial.category === 'Acelerador Gold' ? 'selected' : ''}>Acelerador Gold (+2%)</option>
                <option value="Acelerador Silver" ${initial.category === 'Acelerador Silver' ? 'selected' : ''}>Acelerador Silver (+1%)</option>
                <option value="Estándar" ${initial.category === 'Estándar' ? 'selected' : ''}>Estándar (Base 8-10%)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="mk-price">Precio (COP)</label>
              <input type="number" id="mk-price" class="form-input" value="${initial.price}" step="100000" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="mk-roi">Bono Extra ROI (ej: 0.02 = +2%)</label>
              <input type="number" id="mk-roi" class="form-input" value="${initial.extraRoi}" step="0.005" min="0" max="0.1" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="mk-stock">Stock Disponible</label>
              <input type="number" id="mk-stock" class="form-input" value="${initial.stock}" min="0" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="mk-desc">Descripción del Cerdito</label>
            <textarea id="mk-desc" class="form-textarea" placeholder="Detalles de genética, alimentación o características...">${initial.description}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="mk-image-url">URL Directa de la Imagen (GitHub / CDN)</label>
            <input 
              type="url" 
              id="mk-image-url" 
              class="form-input" 
              placeholder="https://raw.githubusercontent.com/amsterdamlab/piggy-app-v2/main/img/..." 
              value="${initial.imageUrl}" 
            />
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">
              Pega aquí el enlace directo de la imagen subida a GitHub.
            </div>

            <div class="image-preview-container" id="mk-image-preview-box">
              ${initial.imageUrl 
                ? `<img src="${initial.imageUrl}" class="image-preview-img" alt="Vista previa" onerror="this.parentElement.innerHTML='<span class=\\'image-preview-placeholder\\'>URL de imagen no válida</span>';" />` 
                : `<span class="image-preview-placeholder">Vista previa de la imagen</span>`
              }
            </div>
          </div>
        </form>
      `,
      onInit: (modalBody) => {
        const urlInput = modalBody.querySelector('#mk-image-url');
        const previewBox = modalBody.querySelector('#mk-image-preview-box');

        if (urlInput && previewBox) {
          urlInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) {
              previewBox.innerHTML = `
                <img src="${url}" class="image-preview-img" alt="Vista previa" onerror="this.parentElement.innerHTML='<span class=\\'image-preview-placeholder\\'>⚠️ Enlace inválido o imagen no encontrada</span>';" />
              `;
            } else {
              previewBox.innerHTML = `<span class="image-preview-placeholder">Vista previa de la imagen</span>`;
            }
          });
        }
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Actualizar Oferta' : 'Crear Oferta',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const name = document.querySelector('#mk-name').value.trim();
            const category = document.querySelector('#mk-category').value;
            const price = document.querySelector('#mk-price').value;
            const roi = document.querySelector('#mk-roi').value;
            const stock = document.querySelector('#mk-stock').value;
            const desc = document.querySelector('#mk-desc').value.trim();
            const imageUrl = document.querySelector('#mk-image-url').value.trim();

            if (!name) {
              toast.error('El nombre del producto es obligatorio');
              return;
            }

            const payload = {
              itemName: name,
              category,
              price: Number(price),
              extraRoi: Number(roi),
              stock: Number(stock),
              description: desc,
              imageUrl
            };

            let res;
            if (isEdit) {
              res = await marketplaceService.updateItem(item.id, payload);
            } else {
              res = await marketplaceService.createItem(payload);
            }

            if (res.success) {
              toast.success(isEdit ? 'Oferta actualizada exitosamente' : '¡Oferta creada en el Mercado!');
              this.items = await marketplaceService.getItems();
              this.dataTable.setData(this.items);
              m.close();
            } else {
              toast.error(res.error || 'Error al guardar');
            }
          }
        }
      ]
    });
  }

  async deleteItem(id) {
    const res = await marketplaceService.deleteItem(id);
    if (res.success) {
      toast.success('Oferta eliminada del Mercado');
      this.items = this.items.filter(i => i.id !== id);
      this.dataTable.setData(this.items);
    } else {
      toast.error(res.error || 'Error al eliminar');
    }
  }
}
