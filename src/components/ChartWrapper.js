/* ==========================================================================
   PIGGY MASTER ADMIN DASHBOARD - CHART.JS WRAPPER
   Agnostic wrapper for financial and fattening trends
   ========================================================================== */

import { Chart, registerables } from 'chart.js';

// Register all standard Chart.js components
Chart.register(...registerables);

export class ChartWrapper {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.chartInstance = null;
  }

  renderLineChart({ labels, datasets }) {
    this.destroy();

    if (!this.canvas) return;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#94A3B8',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 12,
                weight: '600'
              },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#151B28',
            titleColor: '#F8FAFC',
            bodyColor: '#94A3B8',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: function (context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (context.dataset.yAxisID === 'y' || context.dataset.type === 'line') {
                  return ` ${label}: $${Number(value || 0).toLocaleString('es-CO')}`;
                }
                return ` ${label}: ${value} ${value === 1 ? 'Piggy' : 'Piggys'}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#64748B',
              font: {
                family: "'Plus Jakarta Sans', sans-serif"
              }
            }
          },
          y: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#64748B',
              font: {
                family: "'Plus Jakarta Sans', sans-serif"
              },
              callback: function (value) {
                if (value >= 1000000) {
                  return '$' + (value / 1000000) + 'M';
                }
                if (value >= 1000) {
                  return '$' + (value / 1000) + 'K';
                }
                return '$' + value;
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              color: '#94A3B8',
              precision: 0,
              font: {
                family: "'Plus Jakarta Sans', sans-serif"
              },
              callback: function (value) {
                if (Number.isInteger(value)) {
                  return value;
                }
                return null;
              }
            }
          }
        }
      }
    });
  }

  destroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}
