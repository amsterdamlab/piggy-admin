/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - MARKETPLACE VIEW
   CRUD for Piggy Marketplace, Accelerators & Fattening Stages (URL/Preset images)
   ========================================================================== */

import { marketplaceService } from '../services/marketplaceService.js';
import { DataTable } from '../components/DataTable.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { icons } from '../icons.js';
import { resolveImageUrl, getFallbackImageUrl, PIGGY_PRESET_IMAGES } from '../utils/imageUtils.js';
import { formatCurrency, parseCurrency, setupCurrencyInput } from '../utils/formUtils.js';
import { PIGGY_CATEGORIES, getPiggyCategoryInfo, renderCategorySelectOptions } from '../utils/piggyCategories.js';

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
        text: 'Nuevo Piggy / Acelerador',
        icon: icons.plus,
        onClick: () => this.openItemModal()
      },
      columns: [
        {
          header: 'Imagen',
          render: (item) => {
            const resolvedSrc = resolveImageUrl(item.imageUrl);
            const fallbackSrc = getFallbackImageUrl(item.imageUrl);
            return `
              <div style="width: 48px; height: 48px; border-radius: var(--radius-md); overflow: hidden; background: var(--bg-dark); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center;">
                ${item.imageUrl 
                  ? `<img src="${resolvedSrc}" alt="${item.itemName}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='${fallbackSrc}';" />`
                  : `<span style="color: var(--primary-pink);">${icons.pig}</span>`
                }
              </div>
            `;
          }
        },
        {
          header: 'Producto / Acelerador',
          render: (item) => `
            <div>
              <div style="font-weight: 800; color: var(--text-primary);">${item.itemName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${item.description ? item.description.substring(0, 60) + (item.description.length > 60 ? '...' : '') : 'Sin descripción'}</div>
            </div>
          `
        },
        {
          header: 'Categoría & Ciclo',
          render: (item) => {
            const isBonus = item.extraRoi > 0;
            const isAdvanced = item.daysAdvanced > 0;
            const badgeClass = isBonus ? 'badge-warning' : (isAdvanced ? 'badge-info' : 'badge-neutral');
            const cycleText = isAdvanced ? `${item.daysAdvanced}d avance · ${item.currentWeight || 15} kg` : `144 días ciclo · ${item.currentWeight || 15} kg`;
            return `
              <div>
                <span class="badge ${badgeClass}">
                  ${item.badge}
                </span>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${cycleText}</div>
              </div>
            `;
          }
        },
        {
          header: 'Precio',
          render: (item) => `
            <div style="font-weight: 800; color: var(--accent-green);">
              $${item.price.toLocaleString('es-CO')}
            </div>
          `
        },
        {
          header: 'Stock',
          render: (item) => `
            <div style="font-weight: 700; color: ${item.stock <= 3 ? 'var(--accent-red)' : 'var(--text-primary)'};">
              ${item.stock} unidades
            </div>
          `
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (item) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button type="button" class="btn btn-secondary btn-sm" data-action="edit-item" title="Editar Producto">
                ${icons.edit}
              </button>
              <button type="button" class="btn btn-secondary btn-sm" data-action="delete-item" style="color: var(--accent-red);" title="Eliminar">
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
              <h2 class="card-title">${icons.marketplace} Mercado de Piggys</h2>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                Administración de ofertas activas, cerditos por etapa de engorde y aceleradores de ROI
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
      extraRoi: 0.00,
      stock: 10,
      imageUrl: 'assets/piggies/stage1/et1-1.jpg',
      category: 'estandar',
      daysAdvanced: 0,
      currentWeight: 15.0
    };

    const currentCat = (initial.category || 'estandar').toLowerCase();
    const resolvedInitialImg = resolveImageUrl(initial.imageUrl);
    const fallbackInitialImg = getFallbackImageUrl(initial.imageUrl);

    modal.open({
      title: isEdit ? `Editar Oferta: ${initial.itemName}` : 'Crear Nueva Oferta de Mercado',
      contentHtml: `
        <form id="marketplace-item-form">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label class="form-label" for="mk-name">Nombre del Producto / Cerdito</label>
              <input type="text" id="mk-name" class="form-input" placeholder="Ej: Piggy Lupe (Avanzado 30d)" value="${initial.itemName}" required />
            </div>

            <div class="form-group" style="flex: 1.5;">
              <label class="form-label" for="mk-category">Categoría del Ciclo</label>
              <select id="mk-category" class="form-select">
                ${renderCategorySelectOptions(currentCat)}
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="mk-price">Precio de Compra</label>
              <div class="currency-input-wrapper">
                <span class="currency-input-prefix">$</span>
                <input type="text" id="mk-price" class="form-input" value="${formatCurrency(initial.price)}" placeholder="1.000.000" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="mk-roi">Bono Extra ROI (0.02 = +2%)</label>
              <input type="number" id="mk-roi" class="form-input" value="${initial.extraRoi}" step="0.005" min="0" max="0.1" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="mk-stock">Stock Disponible</label>
              <input type="number" id="mk-stock" class="form-input" value="${initial.stock}" min="0" required />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="mk-days-advanced">Días de Avance (Ahorro)</label>
              <input type="number" id="mk-days-advanced" class="form-input" value="${initial.daysAdvanced || 0}" min="0" max="144" step="1" required />
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Días ahorrados del ciclo de 144 días</div>
            </div>

            <div class="form-group">
              <label class="form-label" for="mk-weight">Peso Inicial / Actual (kg)</label>
              <input type="number" id="mk-weight" class="form-input" value="${initial.currentWeight || 15.0}" min="10" max="150" step="0.1" required />
              <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">Peso real aproximado en granja</div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="mk-desc">Descripción del Cerdito</label>
            <textarea id="mk-desc" class="form-textarea" rows="2" placeholder="Detalles de genética, alimentación o características...">${initial.description}</textarea>
          </div>

          <!-- Selector de Imagen -->
          <div class="form-group">
            <label class="form-label">Seleccionar Cerdito Prediseñado (Etapas 1, 2 y 3)</label>
            <div class="piggy-preset-gallery" id="mk-preset-gallery">
              ${PIGGY_PRESET_IMAGES.map(p => `
                <div class="piggy-preset-card ${initial.imageUrl === p.path ? 'active' : ''}" data-path="${p.path}" title="${p.label}">
                  <img src="${resolveImageUrl(p.path)}" alt="${p.label}" onerror="this.onerror=null; this.src='${getFallbackImageUrl(p.path)}';" />
                  <span class="piggy-preset-badge">${p.id}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="mk-image-url">URL de la Imagen (Ruta Interna o Enlace Directo)</label>
            <input 
              type="text" 
              id="mk-image-url" 
              class="form-input" 
              placeholder="assets/piggies/stage2/et2-2.jpg o https://..." 
              value="${initial.imageUrl}" 
            />
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem;">
              Puedes seleccionar una miniatura arriba o pegar cualquier URL directa (GitHub, CDN, o Cloudinary).
            </div>

            <!-- Live Image Preview -->
            <div class="image-preview-container" id="mk-image-preview-box">
              ${initial.imageUrl 
                ? `<img src="${resolvedInitialImg}" class="image-preview-img" alt="Vista previa" onerror="this.onerror=null; this.src='${fallbackInitialImg}';" />` 
                : `<span class="image-preview-placeholder">Vista previa de la imagen</span>`
              }
            </div>
          </div>
        </form>
      `,
      onInit: (modalBody) => {
        const urlInput = modalBody.querySelector('#mk-image-url');
        const previewBox = modalBody.querySelector('#mk-image-preview-box');
        const categorySelect = modalBody.querySelector('#mk-category');
        const roiInput = modalBody.querySelector('#mk-roi');
        const daysInput = modalBody.querySelector('#mk-days-advanced');
        const weightInput = modalBody.querySelector('#mk-weight');
        const gallery = modalBody.querySelector('#mk-preset-gallery');
        const priceInput = modalBody.querySelector('#mk-price');

        // Formateador monetario con puntos de miles
        setupCurrencyInput(priceInput);

        const updatePreview = (val) => {
          const clean = (val || '').trim();
          if (clean) {
            const resolved = resolveImageUrl(clean);
            const fallback = getFallbackImageUrl(clean);
            previewBox.innerHTML = `
              <img src="${resolved}" class="image-preview-img" alt="Vista previa" onerror="this.onerror=null; this.src='${fallback}'; this.onerror=function(){ this.parentElement.innerHTML='<span class=\\'image-preview-placeholder\\'>URL de imagen no válida</span>'; };" />
            `;
          } else {
            previewBox.innerHTML = `<span class="image-preview-placeholder">Vista previa de la imagen</span>`;
          }

          // Actualizar estado activo en la galería
          if (gallery) {
            gallery.querySelectorAll('.piggy-preset-card').forEach(card => {
              card.classList.toggle('active', card.getAttribute('data-path') === clean);
            });
          }
        };

        // Escuchar input manual de URL
        if (urlInput) {
          urlInput.addEventListener('input', (e) => updatePreview(e.target.value));
        }

        // Selección interactiva desde la galería
        if (gallery && urlInput) {
          gallery.querySelectorAll('.piggy-preset-card').forEach(card => {
            card.addEventListener('click', () => {
              const path = card.getAttribute('data-path');
              urlInput.value = path;
              updatePreview(path);
            });
          });
        }

        // Autocompletado inteligente según categoría elegida
        if (categorySelect) {
          categorySelect.addEventListener('change', (e) => {
            const catKey = e.target.value;
            const def = getPiggyCategoryInfo(catKey);
            if (def && !isEdit) {
              if (roiInput) roiInput.value = def.extraRoiBonus;
              if (daysInput) daysInput.value = def.daysAdvanced;
              if (weightInput) weightInput.value = def.defaultWeight;
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
            const root = m?.overlay || document;
            const name = root.querySelector('#mk-name')?.value?.trim();
            const category = root.querySelector('#mk-category')?.value;
            const price = parseCurrency(root.querySelector('#mk-price')?.value);
            const roi = root.querySelector('#mk-roi')?.value;
            const stock = root.querySelector('#mk-stock')?.value;
            const daysAdvanced = root.querySelector('#mk-days-advanced')?.value;
            const currentWeight = root.querySelector('#mk-weight')?.value;
            const desc = root.querySelector('#mk-desc')?.value?.trim();
            const imageUrl = root.querySelector('#mk-image-url')?.value?.trim();

            if (!name) {
              toast.error('El nombre del producto es obligatorio');
              return;
            }

            const payload = {
              itemName: name,
              category,
              price: Number(price || 0),
              extraRoi: Number(roi),
              stock: Number(stock),
              daysAdvanced: Number(daysAdvanced || 0),
              currentWeight: Number(currentWeight || 15.0),
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
      this.items = await marketplaceService.getItems();
      this.dataTable.setData(this.items);
    } else {
      toast.error(res.error || 'Error al eliminar');
    }
  }
}
