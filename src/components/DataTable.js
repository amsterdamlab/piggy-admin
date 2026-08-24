import { icons } from '../icons.js';

export class DataTable {
  constructor({
    columns = [],
    data = [],
    searchPlaceholder = 'Buscar...',
    filters = [],
    actionButton = null,
    onRowAction = null
  }) {
    this.columns = columns;
    this.originalData = data;
    this.filteredData = [...data];
    this.searchPlaceholder = searchPlaceholder;
    this.filters = filters;
    this.actionButton = actionButton;
    this.onRowAction = onRowAction;
    this.currentSearch = '';
    this.currentFilter = 'all';
    this.container = null;
  }

  render() {
    const tableId = 'dt-' + Math.random().toString(36).substr(2, 9);

    const filterOptionsHtml = this.filters.length > 0
      ? `
        <select class="form-select dt-filter" style="width: auto; min-width: 150px;">
          <option value="all">Todos los estados</option>
          ${this.filters.map(f => `<option value="${f.value}">${f.label}</option>`).join('')}
        </select>
      `
      : '';

    const actionBtnHtml = this.actionButton
      ? `
        <button class="btn btn-primary dt-action-btn">
          ${this.actionButton.icon || icons.plus}
          <span>${this.actionButton.text}</span>
        </button>
      `
      : '';

    const html = `
      <div class="datatable-wrapper" id="${tableId}">
        <div class="table-toolbar">
          <div class="search-box">
            <span class="search-icon">${icons.search}</span>
            <input type="text" class="form-input dt-search" placeholder="${this.searchPlaceholder}" />
          </div>
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            ${filterOptionsHtml}
            ${actionBtnHtml}
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                ${this.columns.map(c => `<th style="${c.style || ''}">${c.header}</th>`).join('')}
              </tr>
            </thead>
            <tbody class="dt-body">
              ${this.renderRows()}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 0.85rem; font-size: 0.8rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
          <span class="dt-counter">Mostrando ${this.filteredData.length} registros</span>
        </div>
      </div>
    `;

    return html;
  }

  renderRows() {
    if (this.filteredData.length === 0) {
      return `
        <tr>
          <td colspan="${this.columns.length}" style="text-align: center; padding: 3rem 1rem; color: var(--text-secondary);">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔍</div>
            <div style="font-weight: 600;">No se encontraron resultados</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Intenta con otros términos o filtros</div>
          </td>
        </tr>
      `;
    }

    return this.filteredData.map((row, idx) => {
      return `
        <tr data-index="${idx}" data-id="${row.id || idx}">
          ${this.columns.map(col => {
            let content = '';
            if (col.render) {
              content = col.render(row, idx);
            } else if (col.key && row[col.key] !== undefined) {
              content = row[col.key];
            }
            return `<td style="${col.style || ''}">${content}</td>`;
          }).join('')}
        </tr>
      `;
    }).join('');
  }

  attachEvents(rootElement) {
    if (!rootElement) return;
    this.container = rootElement.querySelector('.datatable-wrapper');
    if (!this.container) return;

    const searchInput = this.container.querySelector('.dt-search');
    const filterSelect = this.container.querySelector('.dt-filter');
    const actionBtn = this.container.querySelector('.dt-action-btn');
    const tbody = this.container.querySelector('.dt-body');
    const counter = this.container.querySelector('.dt-counter');

    const updateView = () => {
      let filtered = [...this.originalData];

      if (this.currentFilter !== 'all') {
        filtered = filtered.filter(item => {
          const itemStatus = item.status || item.category || item.type;
          return itemStatus === this.currentFilter;
        });
      }

      if (this.currentSearch.trim() !== '') {
        const q = this.currentSearch.toLowerCase();
        filtered = filtered.filter(item => {
          return Object.values(item).some(val => {
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(q);
          });
        });
      }

      this.filteredData = filtered;
      tbody.innerHTML = this.renderRows();
      if (counter) counter.textContent = `Mostrando ${this.filteredData.length} registros`;

      this.attachRowEvents(tbody);
    };

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentSearch = e.target.value;
        updateView();
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        updateView();
      });
    }

    if (actionBtn && this.actionButton?.onClick) {
      actionBtn.addEventListener('click', (e) => {
        this.actionButton.onClick(e);
      });
    }

    this.attachRowEvents(tbody);
  }

  attachRowEvents(tbody) {
    if (!tbody) return;

    tbody.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const tr = btn.closest('tr');
        const index = parseInt(tr.getAttribute('data-index'), 10);
        const rowData = this.filteredData[index];
        if (this.onRowAction && rowData) {
          this.onRowAction(action, rowData, index);
        }
      });
    });
  }

  setData(newData) {
    this.originalData = newData;
    this.filteredData = [...newData];
    if (this.container) {
      const tbody = this.container.querySelector('.dt-body');
      const counter = this.container.querySelector('.dt-counter');
      if (tbody) {
        tbody.innerHTML = this.renderRows();
        this.attachRowEvents(tbody);
      }
      if (counter) {
        counter.textContent = `Mostrando ${this.filteredData.length} registros`;
      }
    }
  }
}
