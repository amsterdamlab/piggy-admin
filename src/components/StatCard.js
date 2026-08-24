export function renderStatCard({ title, value, subtitle = '', iconSvg = '', color = 'pink' }) {
  return `
    <div class="stat-card">
      <div class="stat-icon-wrapper ${color}">
        ${iconSvg}
      </div>
      <div class="stat-content">
        <div class="stat-title">${title}</div>
        <div class="stat-value">${value}</div>
        ${subtitle ? `<div class="stat-subtitle">${subtitle}</div>` : ''}
      </div>
    </div>
  `;
}
