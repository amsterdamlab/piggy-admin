/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - STAT CARD COMPONENT
   ========================================================================== */

export function renderStatCard({ title, value, subtitle = '', iconSvg = '', color = 'pink', href = '' }) {
  const content = `
    <div class="stat-card ${href ? 'stat-card-clickable' : ''}">
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

  if (href) {
    return `<a href="${href}" style="text-decoration: none; color: inherit; display: block; height: 100%;">${content}</a>`;
  }
  return content;
}
