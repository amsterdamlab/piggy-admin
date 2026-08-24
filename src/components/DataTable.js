/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - DATA TABLE COMPONENT
   Interactive table with column sorting, status filters, search, and callbacks
   ========================================================================== */

import { icons } from '../icons.js';

export class DataTable {
  constructor({
    columns = [],
    data = [],
    searchPlaceholder = 'Buscar...',
    filters = [],
    actionButton = null,
    onRowAction = null,
    defaultSortIndex = null,
    defaultSortDirection = 'asc'
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
    this.sortColIndex = defaultSortIndex;
    this.sortDirection = defaultSortIndex !== null ? defaultSortDirection : 'none';
    this.container = null;
  }

  render() {
    const tableId = 'dt-' + Math.random().toString(36).substr(2, 9);

    const filterOptionsHtml = this.filters.length > 0
      ? `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="color: var(--text-muted); display: flex; align-items: center;" title="Filtrar por estado">${icons.filter}</span>
          <select class="form-select dt-filter" style="width: auto; min-width: 160px;">
            <option value="all">Todos los estados</option>
            ${this.filters.map(f => `<option value="${f.value}">${f.label}</option>`).join('')}
          </select>
        </div>
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
          <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
            ${filterOptionsHtml}
            ${actionBtnHtml}
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                ${this.columns.map((c, i) => this.renderHeaderCell(c, i)).join('')}
              </tr>
            </thead>
            <tbody class="dt-body">
              ${this.renderRows()}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 0.85rem; font-size: 0.8rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
          <span class="dt-counter">Mostrando ${this.filteredData.length} registros</span>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Haz clic en los encabezados para ordenar</span>
        </div>
      </div>
    `;

    return html;
  }

  renderHeaderCell(c, i) {
    const isSortable = c.sortable !== false && (c.key || c.sortValue || c.header);
    if (!isSortable) {
      return `<th style="${c.style || ''}">${c.header}</th>`;
    }

    const isCurrentSort = this.sortColIndex === i && this.sortDirection !== 'none';
    const sortClass = isCurrentSort ? 'sorted' : '';
    let sortIcon = icons.sort;
    if (isCurrentSort) {
      sortIcon = this.sortDirection === 'asc' ? icons.sortAsc : icons.sortDesc;
    }

    return `
      <th class="dt-sortable-th ${sortClass}" data-col-index="${i}" style="${c.style || ''}" title="Ordenar por ${c.header}">
        <div style="display: inline-flex; align-items: center; gap: 0.35rem; width: 100%;">
          <span>${c.header}</span>
          <span class="dt-sort-indicator" style="opacity: ${isCurrentSort ? '1' : '0.4'}; color: ${isCurrentSort ? 'var(--primary-pink)' : 'inherit'};">
            ${sortIcon}
          </span>
        </div>
      </th>
    `;
  }

  renderRows() {
    if (this.filteredData.length === 0) {
      return `
        <tr>
          <td colspan="${this.columns.length}" style="text-align: center; padding: 3.5rem 1rem; color: var(--text-secondary);">
            <div style="display: flex; justify-content: center; margin-bottom: 0.75rem; color: var(--text-muted);">
              ${icons.search}
            </div>
            <div style="font-weight: 700; font-size: 1rem;">No se encontraron resultados</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Intenta con otros términos de búsqueda o filtros</div>
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
    this.container = rootElement.querySelector('.datatable-wrapper') || rootElement;
    if (!this.container) return;

    const searchInput = this.container.querySelector('.dt-search');
    const filterSelect = this.container.querySelector('.dt-filter');
    const actionBtn = this.container.querySelector('.dt-action-btn');
    const thead = this.container.querySelector('thead');
    const tbody = this.container.querySelector('.dt-body');
    const counter = this.container.querySelector('.dt-counter');

    const processData = () => {
      let filtered = [...this.originalData];

      // 1. Filter by status/category
      if (this.currentFilter !== 'all') {
        filtered = filtered.filter(item => {
          const itemStatus = item.status || item.category || item.type;
          return itemStatus === this.currentFilter;
        });
      }

      // 2. Filter by search query
      if (this.currentSearch.trim() !== '') {
        const q = this.currentSearch.toLowerCase();
        filtered = filtered.filter(item => {
          return Object.values(item).some(val => {
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(q);
          });
        });
      }

      // 3. Sort
      if (this.sortColIndex !== null && this.sortDirection !== 'none') {
        const col = this.columns[this.sortColIndex];
        if (col) {
          filtered.sort((a, b) => {
            let valA, valB;
            if (typeof col.sortValue === 'function') {
              valA = col.sortValue(a);
              valB = col.sortValue(b);
            } else if (col.key) {
              valA = a[col.key];
              valB = b[col.key];
            } else {
              valA = Object.values(a)[this.sortColIndex];
              valB = Object.values(b)[this.sortColIndex];
            }

            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            let comparison = 0;
            if (typeof valA === 'number' && typeof valB === 'number') {
              comparison = valA - valB;
            } else if (!isNaN(Date.parse(valA)) && !isNaN(Date.parse(valB)) && typeof valA === 'string' && valA.includes('-')) {
              comparison = new Date(valA) - new Date(valB);
            } else {
              comparison = String(valA).localeCompare(String(valB), 'es', { numeric: true, sensitivity: 'base' });
            }

            return this.sortDirection === 'desc' ? -comparison : comparison;
          });
        }
      }

      this.filteredData = filtered;
      if (tbody) {
        tbody.innerHTML = this.renderRows();
        this.attachRowEvents(tbody);
      }
      if (counter) {
        counter.textContent = `Mostrando ${this.filteredData.length} registros`;
      }
    };

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentSearch = e.target.value;
        processData();
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        processData();
      });
    }

    if (actionBtn && this.actionButton?.onClick) {
      actionBtn.addEventListener('click', (e) => {
        this.actionButton.onClick(e);
      });
    }

    // Sort header clicks
    if (thead) {
      thead.querySelectorAll('.dt-sortable-th').forEach(th => {
        th.addEventListener('click', () => {
          const colIndex = parseInt(th.getAttribute('data-col-index'), 10);
          if (this.sortColIndex === colIndex) {
            if (this.sortDirection === 'asc') {
              this.sortDirection = 'desc';
            } else if (this.sortDirection === 'desc') {
              this.sortDirection = 'none';
              this.sortColIndex = null;
            } else {
              this.sortDirection = 'asc';
            }
          } else {
            this.sortColIndex = colIndex;
            this.sortDirection = 'asc';
          }

          // Update header styles
          thead.querySelectorAll('.dt-sortable-th').forEach((headerCell, i) => {
            const isCurrent = this.sortColIndex === i && this.sortDirection !== 'none';
            headerCell.classList.toggle('sorted', isCurrent);
            const indicator = headerCell.querySelector('.dt-sort-indicator');
            if (indicator) {
              indicator.style.opacity = isCurrent ? '1' : '0.4';
              indicator.style.color = isCurrent ? 'var(--primary-pink)' : 'inherit';
              if (isCurrent) {
                indicator.innerHTML = this.sortDirection === 'asc' ? icons.sortAsc : icons.sortDesc;
              } else {
                indicator.innerHTML = icons.sort;
              }
            }
          });

          processData();
        });
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
