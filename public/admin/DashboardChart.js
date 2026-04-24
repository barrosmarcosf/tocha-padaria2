/**
 * DashboardChart.js — v3 (STABLE)
 * Pure English JS - No translation allowed.
 */
(function (global) {
    'use strict';

    const PRIMARY   = '#5a57e6';
    const GRID      = '#f1f5f9';
    const TEXT_AXIS = '#94a3b8';
    const TEXT_KPI  = '#1e293b';

    const fmtBRL = (v) => 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtInt = (v) => Number(v || 0).toLocaleString('pt-BR');

    const METRIC_MAP = {
        revenue  : { field: 'faturamento', label: 'Faturamento', isCurrency: true  },
        orders   : { field: 'pedidos',     label: 'Pedidos',     isCurrency: false },
        averages : { field: 'ticketMedio', label: 'Ticket Médio',isCurrency: true  },
        lucro    : { field: 'lucro',       label: 'Lucro',       isCurrency: true  },
    };

    const hoverLinePlugin = {
        id: 'hoverLine',
        beforeDraw(chart) {
            if (!chart.tooltip?._active?.length) return;
            const ctx = chart.ctx;
            const x   = chart.tooltip._active[0].element.x;
            const { top, bottom } = chart.chartArea;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, top);
            ctx.lineTo(x, bottom);
            ctx.lineWidth   = 1;
            ctx.strokeStyle = 'rgba(90,87,230,0.25)';
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.restore();
        }
    };

    function DashboardChart(canvasId, options) {
        this.canvasId = canvasId;
        this.opts     = Object.assign({ height: 250 }, options || {});
        this._chart   = null;
    }

    DashboardChart.prototype.destroy = function () {
        if (this._chart) {
            try {
                this._chart.destroy();
            } catch (e) { console.warn('[DashboardChart] Internal destroy failed', e); }
            this._chart = null;
        }
    };

    DashboardChart.prototype.render = function (serieTemporal, activeMetric) {
        const canvas = document.getElementById(this.canvasId);
        if (!canvas) {
            setTimeout(() => this.render(serieTemporal, activeMetric), 100);
            return;
        }

        // IMPORTANT: Check if Chart.js already has an instance on this canvas
        const existing = Chart.getChart(canvas);
        if (existing) {
            existing.destroy();
        }

        this.destroy(); // Clean local ref

        const data   = Array.isArray(serieTemporal) ? serieTemporal : [];
        const metric = METRIC_MAP[activeMetric] || METRIC_MAP.revenue;
        const labels = data.map(d => d.data || '');
        const values = data.map(d => Number(d[metric.field]) || 0);

        this._activeMetric = activeMetric || 'revenue';
        this._metric       = metric;

        this._chart = new Chart(canvas.getContext('2d'), {
            type   : 'line',
            data   : {
                labels,
                datasets: [{
                    label: metric.label,
                    data: values,
                    borderColor: PRIMARY,
                    borderWidth: 2,
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.1,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: PRIMARY,
                    pointBorderWidth: 2,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: PRIMARY,
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2,
                }]
            },
            plugins: [hoverLinePlugin],
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#ffffff',
                        titleColor: TEXT_KPI,
                        bodyColor: '#475569',
                        borderColor: 'rgba(0,0,0,0.08)',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 6,
                        displayColors: false,
                        callbacks: {
                            label: (ctx) => metric.isCurrency ? `${metric.label}: ${fmtBRL(ctx.parsed.y)}` : `${metric.label}: ${fmtInt(ctx.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: true, color: GRID, drawBorder: false },
                        ticks: {
                            color: TEXT_AXIS,
                            font: { size: 9.5, weight: '700' },
                            maxRotation: 0,
                            autoSkip: false
                        }
                    },
                    y: {
                        grid: { color: GRID, drawBorder: false },
                        ticks: {
                            color: TEXT_KPI,
                            font: { size: 11, weight: '600' },
                            callback: (val) => metric.isCurrency ? fmtBRL(val) : fmtInt(val)
                        }
                    }
                }
            }
        });
    };

    DashboardChart.prototype.update = function (serieTemporal, activeMetric) {
        if (activeMetric && activeMetric !== this._activeMetric) {
            this.render(serieTemporal, activeMetric);
            return;
        }
        if (!this._chart) { this.render(serieTemporal, activeMetric); return; }
        const data = Array.isArray(serieTemporal) ? serieTemporal : [];
        const metric = this._metric || METRIC_MAP.revenue;
        this._chart.data.labels = data.map(d => d.data || '');
        this._chart.data.datasets[0].data = data.map(d => Number(d[metric.field]) || 0);
        this._chart.update();
    };

    if (typeof module !== 'undefined' && module.exports) module.exports = DashboardChart;
    else global.DashboardChart = DashboardChart;

}(typeof window !== 'undefined' ? window : this));
