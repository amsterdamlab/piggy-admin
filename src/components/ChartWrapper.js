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
              color: '#CBD5E1',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 12,
                weight: '600'
              },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 18
            }
          },
          tooltip: {
            backgroundColor: '#111622',
            titleColor: '#F8FAFC',
            bodyColor: '#E2E8F0',
            borderColor: 'rgba(255, 255, 255, 0.12)',
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
              color: 'rgba(255, 255, 255, 0.04)',
              drawBorder: false
            },
            ticks: {
              color: '#94A3B8',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11
              }
            }
          },
          y: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.04)',
              drawBorder: false
            },
            ticks: {
              color: '#94A3B8',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11
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
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11
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
