/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - GOURMET & ALLIES VIEW
   ========================================================================== */

import { gourmetAlliesService } from '../services/gourmetAlliesService.js';
import { DataTable } from '../components/DataTable.js';
import { modal } from '../components/Modal.js';
import { toast } from '../components/Toast.js';
import { icons } from '../icons.js';
import { resolveImageUrl, getFallbackImageUrl } from '../utils/imageUtils.js';
import { formatCurrency, parseCurrency, setupCurrencyInput } from '../utils/formUtils.js';

export class GourmetAlliesView {
  constructor() {
    this.currentTab = 'gourmet';
    this.gourmetProducts = [];
    this.allies = [];
    this.gourmetTable = null;
    this.alliesTable = null;
    this.container = null;
  }

  async render() {
    this.gourmetProducts = await gourmetAlliesService.getGourmetProducts();
    this.allies = await gourmetAlliesService.getAllies();

    return `
      <div class="gourmet-allies-view">
        <div class="card">
          <div class="card-header" style="flex-direction: column; align-items: flex-start; gap: 1rem;">
            <div>
              <h2 class="card-title">${icons.store} Gestión de Tienda & Aliados</h2>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                Administración de cortes premium, combos para canje y red de aliados comerciales
              </div>
            </div>

            <!-- Tabs -->
            <div class="tabs-container" style="width: 100%; margin-bottom: 0;">
              <button class="tab-btn ${this.currentTab === 'gourmet' ? 'active' : ''}" data-tab="gourmet" style="display: inline-flex; align-items: center; gap: 6px;">
                ${icons.store} <span>Tienda Piggy (${this.gourmetProducts.length})</span>
              </button>
              <button class="tab-btn ${this.currentTab === 'allies' ? 'active' : ''}" data-tab="allies" style="display: inline-flex; align-items: center; gap: 6px;">
                ${icons.allies} <span>Red de Aliados (${this.allies.length})</span>
              </button>
            </div>
          </div>

          <!-- Tab 1: Gourmet Products -->
          <div id="tab-content-gourmet" style="display: ${this.currentTab === 'gourmet' ? 'block' : 'none'};">
            <div id="gourmet-datatable-wrapper">
              ${this.renderGourmetTableHtml()}
            </div>
          </div>

          <!-- Tab 2: Allies Directory -->
          <div id="tab-content-allies" style="display: ${this.currentTab === 'allies' ? 'block' : 'none'};">
            <div id="allies-datatable-wrapper">
              ${this.renderAlliesTableHtml()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderGourmetTableHtml() {
    this.gourmetTable = new DataTable({
      searchPlaceholder: 'Buscar corte o combo...',
      actionButton: {
        text: 'Nuevo Producto / Combo',
        icon: icons.plus,
        onClick: () => this.openGourmetModal()
      },
      columns: [
        {
          header: 'Imagen',
          render: (p) => {
            const resolved = resolveImageUrl(p.imageUrl);
            const fallback = getFallbackImageUrl(p.imageUrl);
            return `
              <div style="width: 44px; height: 44px; border-radius: var(--radius-md); overflow: hidden; background: var(--bg-dark); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center;">
                ${p.imageUrl 
                  ? `<img src="${resolved}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='${fallback}';" />`
                  : `<span style="color: var(--primary-pink);">${icons.gourmet}</span>`
                }
              </div>
            `;
          }
        },
        {
          header: 'Producto / Corte',
          render: (p) => `
            <div>
              <div style="font-weight: 800; color: var(--text-primary);">${p.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${p.description.substring(0, 50)}${p.description.length > 50 ? '...' : ''}</div>
            </div>
          `
        },
        {
          header: 'Categoría',
          render: (p) => `<span class="badge badge-neutral">${p.category}</span>`
        },
        {
          header: 'Precio / Puntos',
          render: (p) => `
            <div>
              <div style="font-weight: 800; color: var(--accent-green);">$${p.price.toLocaleString('es-CO')}</div>
              <div style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 700;">${p.pointsPrice} pts</div>
            </div>
          `
        },
        {
          header: 'Stock',
          render: (p) => `<div style="font-weight: 700;">${p.stock} disp.</div>`
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (p) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="edit-gourmet" title="Editar">
                ${icons.edit}
              </button>
              <button class="btn btn-secondary btn-sm" data-action="delete-gourmet" style="color: var(--accent-red);" title="Eliminar">
                ${icons.trash}
              </button>
            </div>
          `
        }
      ],
      data: this.gourmetProducts,
      onRowAction: (action, p) => this.handleGourmetAction(action, p)
    });

    return this.gourmetTable.render();
  }

  renderAlliesTableHtml() {
    this.alliesTable = new DataTable({
      searchPlaceholder: 'Buscar por aliado, categoría, especialidad o ciudad...',
      actionButton: {
        text: 'Nuevo Aliado Comercial',
        icon: icons.plus,
        onClick: () => this.openAllyModal()
      },
      columns: [
        {
          header: '# Orden',
          render: (a) => `
            <span class="badge ${a.displayOrder !== null ? 'badge-primary' : 'badge-neutral'}" style="font-weight: 800; font-size: 0.75rem; min-width: 28px; text-align: center; display: inline-block;">
              ${a.displayOrder !== null ? `#${a.displayOrder}` : '—'}
            </span>
          `
        },
        {
          header: 'Logo / Imagen',
          render: (a) => {
            const resolved = resolveImageUrl(a.imageUrl);
            const fallback = getFallbackImageUrl(a.imageUrl);
            return `
              <div style="width: 44px; height: 44px; border-radius: var(--radius-md); overflow: hidden; background: var(--bg-dark); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center;">
                ${a.imageUrl 
                  ? `<img src="${resolved}" alt="${a.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='${fallback}';" />`
                  : `<span style="color: var(--accent-green);">${icons.allies}</span>`
                }
              </div>
            `;
          }
        },
        {
          header: 'Aliado Comercial',
          render: (a) => `
            <div>
              <div style="font-weight: 800; color: var(--text-primary); font-size: 0.95rem;">${a.name}</div>
              ${a.specialty ? `<div style="font-size: 0.75rem; color: var(--primary-pink); font-weight: 700; margin-top: 2px;">${a.specialty}</div>` : ''}
              ${a.description ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${a.description}">${a.description}</div>` : ''}
            </div>
          `
        },
        {
          header: 'Categoría',
          render: (a) => `<span class="badge badge-info" style="font-weight: 600;">${a.category}</span>`
        },
        {
          header: 'Beneficio Piggy',
          render: (a) => `
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: var(--accent-gold); display: inline-flex; align-items: center;">${icons.gift}</span>
              <span style="font-weight: 700; color: var(--accent-gold); font-size: 0.85rem;">${a.benefit || 'Beneficio exclusivo'}</span>
            </div>
          `
        },
        {
          header: 'Contacto & Ubicación',
          render: (a) => `
            <div>
              ${a.phone ? `<div style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 4px;"><span style="color: var(--text-muted); display: inline-flex;">${icons.phone}</span> ${a.phone}</div>` : ''}
              ${a.location ? `<div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px; margin-top: 2px;"><span style="color: var(--accent-green); display: inline-flex;">${icons.mapPin}</span> ${a.location}</div>` : ''}
              ${a.address ? `<div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 1px; padding-left: 18px;">${a.address}</div>` : ''}
            </div>
          `
        },
        {
          header: 'Acciones',
          style: 'text-align: right;',
          render: (a) => `
            <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn btn-secondary btn-sm" data-action="edit-ally" title="Editar">
                ${icons.edit}
              </button>
              <button class="btn btn-secondary btn-sm" data-action="delete-ally" style="color: var(--accent-red);" title="Eliminar">
                ${icons.trash}
              </button>
            </div>
          `
        }
      ],
      data: this.allies,
      onRowAction: (action, a) => this.handleAllyAction(action, a)
    });

    return this.alliesTable.render();
  }

  attachEvents(container) {
    this.container = container;

    // Tabs switching
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    if (this.gourmetTable) {
      this.gourmetTable.attachEvents(container.querySelector('#gourmet-datatable-wrapper'));
    }
    if (this.alliesTable) {
      this.alliesTable.attachEvents(container.querySelector('#allies-datatable-wrapper'));
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    if (!this.container) return;

    this.container.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });

    const gourmetEl = this.container.querySelector('#tab-content-gourmet');
    const alliesEl = this.container.querySelector('#tab-content-allies');

    if (gourmetEl) gourmetEl.style.display = tab === 'gourmet' ? 'block' : 'none';
    if (alliesEl) alliesEl.style.display = tab === 'allies' ? 'block' : 'none';
  }

  // ==================== GOURMET MODAL ====================
  openGourmetModal(product = null) {
    const isEdit = !!product;
    const initial = product || {
      name: '',
      category: 'Combos Especiales',
      price: 150000,
      pointsPrice: 400,
      stock: 15,
      description: '',
      imageUrl: ''
    };

    modal.open({
      title: isEdit ? `Editar Producto: ${initial.name}` : 'Crear Producto / Combo Gourmet',
      contentHtml: `
        <form id="gourmet-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="g-name">Nombre del Producto / Combo</label>
              <input type="text" id="g-name" class="form-input" placeholder="Ej: Combo Parrillero 5kg" value="${initial.name}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="g-category">Categoría</label>
              <select id="g-category" class="form-select">
                <option value="Combos Especiales" ${initial.category === 'Combos Especiales' ? 'selected' : ''}>Combos Especiales</option>
                <option value="Cortes Premium" ${initial.category === 'Cortes Premium' ? 'selected' : ''}>Cortes Premium</option>
                <option value="Embutidos Artesanales" ${initial.category === 'Embutidos Artesanales' ? 'selected' : ''}>Embutidos Artesanales</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="g-price">Precio</label>
              <div class="currency-input-wrapper">
                <span class="currency-input-prefix">$</span>
                <input type="text" id="g-price" class="form-input" value="${formatCurrency(initial.price)}" placeholder="150.000" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="g-points">Precio en Puntos</label>
              <input type="number" id="g-points" class="form-input" value="${initial.pointsPrice}" step="10" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="g-stock">Stock</label>
              <input type="number" id="g-stock" class="form-input" value="${initial.stock}" min="0" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="g-desc">Descripción / Cortes Incluidos</label>
            <textarea id="g-desc" class="form-textarea" placeholder="Detalle de cortes, peso y presentación...">${initial.description}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="g-image-url">URL Directa de la Imagen</label>
            <input type="url" id="g-image-url" class="form-input" placeholder="https://..." value="${initial.imageUrl}" />
            
            <!-- Live Preview -->
            <div class="image-preview-container" id="g-image-preview-box">
              ${initial.imageUrl 
                ? `<img src="${initial.imageUrl}" class="image-preview-img" alt="Preview" onerror="this.parentElement.innerHTML='<span class=\\'image-preview-placeholder\\'>URL inválida</span>';" />`
                : `<span class="image-preview-placeholder">Vista previa del corte / combo</span>`
              }
            </div>
          </div>
        </form>
      `,
      onInit: (modalBody) => {
        const input = modalBody.querySelector('#g-image-url');
        const box = modalBody.querySelector('#g-image-preview-box');
        const priceInput = modalBody.querySelector('#g-price');

        // Formato monetario con separador de miles
        setupCurrencyInput(priceInput);

        if (input && box) {
          input.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) {
              box.innerHTML = `<img src="${url}" class="image-preview-img" alt="Preview" onerror="this.parentElement.innerHTML='<span class=\\'image-preview-placeholder\\'>Imagen no encontrada</span>';" />`;
            } else {
              box.innerHTML = `<span class="image-preview-placeholder">Vista previa del corte / combo</span>`;
            }
          });
        }
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Actualizar Producto' : 'Crear Producto',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const root = m?.overlay || document;
            const name = root.querySelector('#g-name')?.value?.trim();
            const category = root.querySelector('#g-category')?.value;
            const price = parseCurrency(root.querySelector('#g-price')?.value);
            const points = root.querySelector('#g-points')?.value;
            const stock = root.querySelector('#g-stock')?.value;
            const desc = root.querySelector('#g-desc')?.value?.trim();
            const imageUrl = root.querySelector('#g-image-url')?.value?.trim();

            if (!name) {
              toast.error('El nombre del producto es obligatorio');
              return;
            }

            const payload = {
              name,
              category,
              price: Number(price || 0),
              pointsPrice: Number(points),
              stock: Number(stock),
              description: desc,
              imageUrl
            };

            let res;
            if (isEdit) {
              res = await gourmetAlliesService.updateGourmetProduct(product.id, payload);
            } else {
              res = await gourmetAlliesService.createGourmetProduct(payload);
            }

            if (res.success) {
              toast.success(isEdit ? 'Producto actualizado' : '¡Producto creado!');
              this.gourmetProducts = await gourmetAlliesService.getGourmetProducts();
              this.gourmetTable.setData(this.gourmetProducts);
              m.close();
            } else {
              toast.error(res.error || 'Error al guardar');
            }
          }
        }
      ]
    });
  }

  // ==================== ALLIES MODAL ====================
  openAllyModal(ally = null) {
    const isEdit = !!ally;
    const initial = ally || {
      name: '',
      category: 'Restaurante',
      specialty: '',
      benefit: '',
      phone: '',
      location: 'Cali, Valle del Cauca',
      address: '',
      displayOrder: '',
      imageUrl: '',
      description: ''
    };

    // Recopilar categorías existentes para el autocompletado
    const defaultCategories = ['Restaurante', 'Barbería', 'Wash Clean', 'Ecológico', 'Petshop', 'Agencia', 'Carnicería Boutique', 'Punto de Distribución', 'Cafetería', 'Salud & Belleza'];
    const currentCategories = this.allies.map(a => a.category).filter(Boolean);
    const categoryOptions = Array.from(new Set([...defaultCategories, ...currentCategories]));

    modal.open({
      size: 'large',
      title: isEdit ? `Editar Aliado: ${initial.name}` : 'Registrar Nuevo Aliado Comercial',
      contentHtml: `
        <form id="ally-form">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label class="form-label" for="a-name">Nombre del Establecimiento / Marca <span style="color: var(--accent-red);">*</span></label>
              <input type="text" id="a-name" class="form-input" placeholder="Ej: Prime Motors Wash" value="${initial.name || ''}" required />
            </div>

            <div class="form-group" style="flex: 1;">
              <label class="form-label" for="a-display-order">Orden de Visualización (#)</label>
              <input type="number" id="a-display-order" class="form-input" placeholder="Ej: 1, 2, 3..." value="${initial.displayOrder !== null && initial.displayOrder !== undefined ? initial.displayOrder : ''}" min="1" step="1" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="a-category">Categoría del Negocio</label>
              <input list="allies-category-options" id="a-category" class="form-input" placeholder="Selecciona o escribe..." value="${initial.category || 'Restaurante'}" />
              <datalist id="allies-category-options">
                ${categoryOptions.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
              </datalist>
            </div>

            <div class="form-group">
              <label class="form-label" for="a-specialty">Especialidad / Subtítulo</label>
              <input type="text" id="a-specialty" class="form-input" placeholder="Ej: Lavadero Premium, Marketing Digital..." value="${initial.specialty || ''}" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="a-benefit">Beneficio / Descuento Piggy <span style="color: var(--accent-red);">*</span></label>
              <input type="text" id="a-benefit" class="form-input" placeholder="Ej: 15% en Combo Ahorrador, 2x1 los jueves..." value="${initial.benefit || ''}" required />
            </div>

            <div class="form-group">
              <label class="form-label" for="a-phone">Teléfono / WhatsApp de Contacto</label>
              <input type="text" id="a-phone" class="form-input" placeholder="Ej: 312 458 0036" value="${initial.phone || ''}" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="a-location">Ciudad / Región</label>
              <input type="text" id="a-location" class="form-input" placeholder="Ej: Cali, Valle del Cauca" value="${initial.location || ''}" />
            </div>

            <div class="form-group">
              <label class="form-label" for="a-address">Dirección Física</label>
              <input type="text" id="a-address" class="form-input" placeholder="Ej: Calle 42 # 41-03 Antonio Nariño" value="${initial.address || ''}" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="a-image-url">URL de la Imagen / Logotipo del Aliado</label>
            <input type="url" id="a-image-url" class="form-input" placeholder="https://..." value="${initial.imageUrl || ''}" />
            
            <!-- Live Preview -->
            <div class="image-preview-container" id="a-logo-preview-box" style="margin-top: 0.5rem;">
              ${initial.imageUrl 
                ? `<img src="${initial.imageUrl}" class="image-preview-img" alt="Logo" onerror="this.parentElement.innerHTML='<span class=\\'image-preview-placeholder\\'>Logo no válido</span>';" />`
                : `<span class="image-preview-placeholder">Vista previa del Logo / Foto del Aliado</span>`
              }
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="a-description">Descripción del Establecimiento / Servicios</label>
            <textarea id="a-description" class="form-textarea" rows="3" placeholder="Describe brevemente el servicio, ambiente y especialidades del aliado...">${initial.description || ''}</textarea>
          </div>
        </form>
      `,
      onInit: (modalBody) => {
        const input = modalBody.querySelector('#a-image-url');
        const box = modalBody.querySelector('#a-logo-preview-box');
        if (input && box) {
          input.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) {
              box.innerHTML = `<img src="${url}" class="image-preview-img" alt="Logo" onerror="this.parentElement.innerHTML='<span class=\\'image-preview-placeholder\\'>Logo no encontrado</span>';" />`;
            } else {
              box.innerHTML = `<span class="image-preview-placeholder">Vista previa del Logo / Foto del Aliado</span>`;
            }
          });
        }
      },
      footerButtons: [
        { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
        {
          text: isEdit ? 'Actualizar Aliado' : 'Guardar Aliado',
          class: 'btn-primary',
          onClick: async (e, m) => {
            const root = m?.overlay || document;
            const name = root.querySelector('#a-name')?.value?.trim();
            const displayOrderRaw = root.querySelector('#a-display-order')?.value?.trim();
            const category = root.querySelector('#a-category')?.value?.trim() || 'Restaurante';
            const specialty = root.querySelector('#a-specialty')?.value?.trim() || '';
            const benefit = root.querySelector('#a-benefit')?.value?.trim() || '';
            const phone = root.querySelector('#a-phone')?.value?.trim() || '';
            const location = root.querySelector('#a-location')?.value?.trim() || '';
            const address = root.querySelector('#a-address')?.value?.trim() || '';
            const imageUrl = root.querySelector('#a-image-url')?.value?.trim() || '';
            const description = root.querySelector('#a-description')?.value?.trim() || '';

            if (!name) {
              toast.error('El nombre del establecimiento es requerido');
              return;
            }

            if (!benefit) {
              toast.error('El beneficio o descuento para usuarios Piggy es requerido');
              return;
            }

            const payload = {
              name,
              category,
              specialty,
              benefit,
              phone,
              location,
              address,
              imageUrl,
              description,
              displayOrder: displayOrderRaw !== '' && !isNaN(Number(displayOrderRaw)) ? Number(displayOrderRaw) : null
            };

            let res;
            if (isEdit) {
              res = await gourmetAlliesService.updateAlly(ally.id, payload);
            } else {
              res = await gourmetAlliesService.createAlly(payload);
            }

            if (res.success) {
              toast.success(isEdit ? 'Aliado actualizado correctamente' : '¡Aliado comercial registrado exitosamente!');
              this.allies = await gourmetAlliesService.getAllies();
              this.alliesTable.setData(this.allies);
              m.close();
            } else {
              toast.error(res.error || 'Error al guardar el aliado comercial');
            }
          }
        }
      ]
    });
  }

  handleGourmetAction(action, p) {
    if (action === 'edit-gourmet') {
      this.openGourmetModal(p);
    } else if (action === 'delete-gourmet') {
      if (confirm(`¿Eliminar producto "${p.name}"?`)) {
        gourmetAlliesService.deleteGourmetProduct(p.id).then(res => {
          if (res.success) {
            toast.success('Producto eliminado');
            this.gourmetProducts = this.gourmetProducts.filter(i => i.id !== p.id);
            this.gourmetTable.setData(this.gourmetProducts);
          }
        });
      }
    }
  }

  handleAllyAction(action, a) {
    if (action === 'edit-ally') {
      this.openAllyModal(a);
    } else if (action === 'delete-ally') {
      if (confirm(`¿Eliminar aliado "${a.name}"?`)) {
        gourmetAlliesService.deleteAlly(a.id).then(res => {
          if (res.success) {
            toast.success('Aliado eliminado');
            this.allies = this.allies.filter(i => i.id !== a.id);
            this.alliesTable.setData(this.allies);
          }
        });
      }
    }
  }
}
