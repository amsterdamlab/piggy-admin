import { Chart, registerables } from 'chart.js';

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
      type: 'line',
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
            usePointStyle: true
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
                return value;
              }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false
            },
            ticks: {
              color: '#FFB800',
              font: {
                family: "'Plus Jakarta Sans', sans-serif"
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
