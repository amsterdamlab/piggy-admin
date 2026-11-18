/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - PIGGY MODALS
   Modales de edición y asignación manual de cerditos (extraídos de PiggiesView)
   ========================================================================== */

import { piggiesService } from '../../services/piggiesService.js';
import { usersService } from '../../services/usersService.js';
import { modal } from '../../components/Modal.js';
import { toast } from '../../components/Toast.js';
import { icons } from '../../icons.js';
import { resolveImageUrl, getFallbackImageUrl, PIGGY_PRESET_IMAGES } from '../../utils/imageUtils.js';
import { formatCurrency, parseCurrency, setupCurrencyInput, setupDateTimePicker } from '../../utils/formUtils.js';
import { getPiggyCategoryInfo, renderCategorySelectOptions } from '../../utils/piggyCategories.js';

export function openEditPiggyModal(view, piggy) {
  const currentCat = (piggy.category || 'estandar').toLowerCase();
  const formattedEndDate = view.formatDateTimeForInput(piggy.endDate);
  const resolvedInitialImg = resolveImageUrl(piggy.imageUrl || 'assets/piggies/stage1/et1-1.jpg');
  const fallbackInitialImg = getFallbackImageUrl(piggy.imageUrl || 'assets/piggies/stage1/et1-1.jpg');

  modal.open({
    title: `Editar Piggy: ${piggy.name}`,
    contentHtml: `
      <form id="edit-piggy-form">
        <div class="form-row">
          <div class="form-group" style="flex: 1.5;">
            <label class="form-label">Usuario / Dueño</label>
            <input type="text" class="form-input" value="${piggy.userName} (${piggy.userPhone})" disabled />
          </div>

          <div class="form-group" style="flex: 1.5;">
            <label class="form-label" for="edit-name-input">Nombre o Etiqueta</label>
            <input type="text" id="edit-name-input" class="form-input" value="${piggy.name}" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="edit-category-select">Categoría del Piggy</label>
            <select id="edit-category-select" class="form-select">
              ${renderCategorySelectOptions(currentCat)}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-status-select">Estado del Ciclo</label>
            <select id="edit-status-select" class="form-select">
              <option value="engorde" ${piggy.status === 'engorde' ? 'selected' : ''}>Engorde</option>
              <option value="completado" ${piggy.status === 'completado' ? 'selected' : ''}>Completado</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="edit-contract-code-input">Código de Contrato</label>
            <input 
              type="text" 
              id="edit-contract-code-input" 
              class="form-input" 
              value="${piggy.contractCode || ''}" 
              placeholder="Ej: PG-2026-001" 
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-contract-url-input">URL del Contrato</label>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <input 
                type="text" 
                id="edit-contract-url-input" 
                class="form-input" 
                value="${piggy.contractUrl || ''}" 
                placeholder="https://... o ruta del archivo" 
              />
              ${piggy.contractUrl ? `
                <a href="${piggy.contractUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-icon btn-sm" title="Abrir enlace de contrato">
                  ${icons.arrowUpRight}
                </a>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group datetime-enhanced-group">
            <label class="form-label" for="edit-end-date-input">Fecha y Hora de Liquidación</label>
            <div class="datetime-input-wrapper">
              <input 
                type="datetime-local" 
                id="edit-end-date-input" 
                class="form-input" 
                value="${formattedEndDate}" 
                style="color-scheme: dark;"
              />
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px;">
              Fecha y hora proyectada para finalización y pago del ciclo
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-roi-input">Beneficio Extra (ej: 0.02 = +2%)</label>
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
            <label class="form-label" for="edit-weight-input">Peso Actual (kg)</label>
            <input 
              type="number" 
              id="edit-weight-input" 
              class="form-input" 
              step="0.1" 
              min="1" 
              max="180" 
              value="${piggy.currentWeight}" 
              required 
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="edit-final-weight-input">Peso Final (kg)</label>
            <input 
              type="number" 
              id="edit-final-weight-input" 
              class="form-input" 
              step="0.1" 
              min="10" 
              max="200" 
              value="${piggy.finalWeight || 100.0}" 
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Seleccionar Cerdito Prediseñado (Etapas 1, 2 y 3)</label>
          <div class="piggy-preset-gallery" id="edit-preset-gallery" style="display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.5rem; scrollbar-width: thin;">
            ${PIGGY_PRESET_IMAGES.map(p => `
              <div class="piggy-preset-card ${piggy.imageUrl === p.path ? 'active' : ''}" data-path="${p.path}" title="${p.label}" style="cursor: pointer; flex-shrink: 0; width: 44px; height: 44px; border-radius: var(--radius-sm); border: 2px solid ${piggy.imageUrl === p.path ? 'var(--primary-pink)' : 'var(--border-color)'}; overflow: hidden; background: var(--bg-dark);">
                <img src="${resolveImageUrl(p.path)}" alt="${p.label}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='${getFallbackImageUrl(p.path)}';" />
              </div>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-image-url-input">URL Imagen del Cerdito</label>
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <input 
              type="text" 
              id="edit-image-url-input" 
              class="form-input" 
              value="${piggy.imageUrl || ''}" 
              placeholder="assets/piggies/stage1/et1-1.jpg o https://..." 
            />
            <div id="edit-image-preview-box" style="width: 44px; height: 44px; border-radius: var(--radius-md); border: 1px solid var(--border-color); overflow: hidden; background: var(--bg-dark); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
              <img id="edit-image-preview-img" src="${resolvedInitialImg}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null; this.src='${fallbackInitialImg}';" />
            </div>
          </div>
        </div>
      </form>
    `,
    onInit: (modalBody) => {
      const endDateInput = modalBody.querySelector('#edit-end-date-input');
      if (endDateInput) {
        setupDateTimePicker(endDateInput);
      }

      const urlInput = modalBody.querySelector('#edit-image-url-input');
      const previewImg = modalBody.querySelector('#edit-image-preview-img');
      const presetCards = modalBody.querySelectorAll('.piggy-preset-card');

      presetCards.forEach(card => {
        card.addEventListener('click', () => {
          presetCards.forEach(c => {
            c.classList.remove('active');
            c.style.borderColor = 'var(--border-color)';
          });
          card.classList.add('active');
          card.style.borderColor = 'var(--primary-pink)';
          const path = card.getAttribute('data-path');
          urlInput.value = path;
          if (previewImg) {
            previewImg.src = resolveImageUrl(path);
          }
        });
      });

      urlInput.addEventListener('input', () => {
        const val = urlInput.value.trim();
        if (previewImg) {
          previewImg.src = val ? resolveImageUrl(val) : fallbackInitialImg;
        }
      });
    },
    footerButtons: [
      { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
      {
        text: 'Guardar Cambios',
        class: 'btn-success',
        onClick: async (e, m) => {
          const root = m?.overlay || document;
          const name = root.querySelector('#edit-name-input')?.value?.trim();
          const category = root.querySelector('#edit-category-select')?.value;
          const status = root.querySelector('#edit-status-select')?.value;
          const contractCode = root.querySelector('#edit-contract-code-input')?.value?.trim();
          const contractUrl = root.querySelector('#edit-contract-url-input')?.value?.trim();
          const endDateVal = root.querySelector('#edit-end-date-input')?.value;
          const roi = root.querySelector('#edit-roi-input')?.value;
          const weight = root.querySelector('#edit-weight-input')?.value;
          const finalWeight = root.querySelector('#edit-final-weight-input')?.value;
          const imageUrl = root.querySelector('#edit-image-url-input')?.value?.trim();

          if (!name) {
            toast.error('El nombre del cerdito no puede estar vacío');
            return;
          }

          const isoEndDate = endDateVal ? new Date(endDateVal).toISOString() : null;

          const res = await piggiesService.updatePiggy(piggy.id, {
            name,
            category,
            status,
            contractCode,
            contractUrl,
            endDate: isoEndDate,
            extraRoiBonus: Number(roi),
            currentWeight: Number(weight),
            finalWeight: finalWeight ? Number(finalWeight) : null,
            imageUrl
          });

          if (res.success) {
            toast.success('Piggy actualizado correctamente');
            piggy.name = name;
            piggy.category = category;
            piggy.status = status;
            piggy.contractCode = contractCode;
            piggy.contractUrl = contractUrl;
            piggy.endDate = isoEndDate;
            piggy.extraRoiBonus = Number(roi);
            piggy.currentWeight = Number(weight);
            piggy.finalWeight = finalWeight ? Number(finalWeight) : null;
            piggy.imageUrl = imageUrl;

            if (view.container) {
              view.piggies = await piggiesService.getPiggies('all');
              view.container.innerHTML = view.renderViewTemplate();
              view.attachEvents(view.container);
            } else {
              view.dataTable.setData(view.piggies);
            }
            m.close();
          } else {
            toast.error(res.error || 'Error al actualizar cerdito');
          }
        }
      }
    ]
  });
}

export async function openCreatePiggyModal(view) {
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
            <label class="form-label" for="new-piggy-category">Categoría</label>
            <select id="new-piggy-category" class="form-select">
              ${renderCategorySelectOptions('estandar')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="new-piggy-amount">Compra Productiva</label>
            <div class="currency-input-wrapper">
              <span class="currency-input-prefix">$</span>
              <input type="text" id="new-piggy-amount" class="form-input" value="${formatCurrency(1000000)}" placeholder="1.000.000" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="new-piggy-contract">Código Contrato (Opcional)</label>
            <input type="text" id="new-piggy-contract" class="form-input" placeholder="Ej: PG-2026-001" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="new-piggy-weight">Peso Inicial (kg)</label>
            <input type="number" id="new-piggy-weight" class="form-input" value="6.0" min="1" step="0.5" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="new-piggy-roi">Beneficio Extra (ej: 0.02)</label>
            <input type="number" id="new-piggy-roi" class="form-input" value="0.00" step="0.005" />
          </div>
        </div>
      </form>
    `,
    onInit: (modalBody) => {
      const amountInput = modalBody.querySelector('#new-piggy-amount');
      setupCurrencyInput(amountInput);

      const categorySelect = modalBody.querySelector('#new-piggy-category');
      const weightInput = modalBody.querySelector('#new-piggy-weight');
      const roiInput = modalBody.querySelector('#new-piggy-roi');

      if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
          const def = getPiggyCategoryInfo(e.target.value);
          if (def) {
            if (weightInput) weightInput.value = def.defaultWeight;
            if (roiInput) roiInput.value = def.extraRoiBonus;
          }
        });
      }
    },
    footerButtons: [
      { text: 'Cancelar', class: 'btn-secondary', onClick: (e, m) => m.close() },
      {
        text: 'Asignar y Crear',
        class: 'btn-primary',
        onClick: async (e, m) => {
          const root = m?.overlay || document;
          const userId = root.querySelector('#piggy-user-select')?.value;
          const name = root.querySelector('#new-piggy-name')?.value?.trim();
          const category = root.querySelector('#new-piggy-category')?.value;
          const contractCode = root.querySelector('#new-piggy-contract')?.value?.trim();
          const amount = parseCurrency(root.querySelector('#new-piggy-amount')?.value);
          const weight = root.querySelector('#new-piggy-weight')?.value;
          const roi = root.querySelector('#new-piggy-roi')?.value;

          if (!name) {
            toast.error('Ingresa un nombre para el cerdito');
            return;
          }

          const catDef = getPiggyCategoryInfo(category);
          const res = await piggiesService.createPiggyForUser(userId, {
            name,
            category,
            cycleDays: catDef?.cycleDays || 122,
            finalWeight: catDef?.defaultFinalWeight || 82.5,
            contractCode,
            investmentAmount: Number(amount || 0),
            currentWeight: Number(weight),
            extraRoiBonus: Number(roi),
            status: 'engorde'
          });

          if (res.success) {
            toast.success('Piggy asignado exitosamente');
            view.piggies = await piggiesService.getPiggies('all');
            if (view.container) {
              view.container.innerHTML = view.renderViewTemplate();
              view.attachEvents(view.container);
            }
            m.close();
          } else {
            toast.error(res.error || 'Error al crear Piggy');
          }
        }
      }
    ]
  });
}
