// Mock data for dashboard development
window.DASH_DATA = (function () {
  const days = 30;
  const today = new Date();
  const seed = (n) => Math.abs(Math.sin(n * 12.9898) * 43758.5453 % 1);

  const buildSeries = (base, variance, peakDays) => {
    const arr = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (days - 1 - i));
      const weekend = d.getDay() === 6;
      const fri = d.getDay() === 5;
      let v = base + seed(i + 7) * variance;
      if (weekend) v *= 3.4 + seed(i + 1) * 0.5;
      if (fri) v *= 1.6;
      if (peakDays.includes(i)) v *= 1.3;
      arr.push({
        date: d,
        label: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
        value: Math.round(v),
      });
    }
    return arr;
  };

  const current  = buildSeries(180, 320, [12, 19, 26]);
  const previous = buildSeries(160, 280, [8, 15]);

  return {
    user: { name: 'Tocha Padaria', email: 'admin@tochapadaria.com', initials: 'TP' },
    period: 'Este mês',
    today,
    kpis: {
      faturamento: { value: 28640, prev: 24180, unit: 'R$', spark: current.map(d => d.value) },
      pedidos:     { value: 142,   prev: 118,   spark: current.map(d => Math.max(1, Math.round(d.value / 220))) },
      ticket:      { value: 201.69, prev: 204.91, unit: 'R$', spark: current.map((_, i) => 180 + Math.abs(Math.sin(i * 0.9)) * 50) },
      lucro:       { value: 11456, prev: 8920,  unit: 'R$', margin: 40, spark: current.map(d => Math.round(d.value * 0.4)) },
    },
    revenueSeries: { current, previous },
    payments: [
      { label: 'Pix',               value: 16240, count: 88, color: 'var(--c1)' },
      { label: 'Cartão de crédito', value: 9870,  count: 38, color: 'var(--c2)' },
      { label: 'Cartão de débito',  value: 1980,  count: 12, color: 'var(--c3)' },
      { label: 'Dinheiro',          value: 550,   count: 4,  color: 'var(--c4)' },
    ],
    topProducts: [
      { rank: 1, name: 'Sourdough Tradicional', cat: 'Padaria', qty: 62, gross: 1798, growth: 22 },
      { rank: 2, name: 'Focaccia de Damasco',   cat: 'Padaria', qty: 41, gross: 1230, growth: 18 },
      { rank: 3, name: 'Brioche Noisette',       cat: 'Doçaria', qty: 38, gross: 988, growth: 12 },
    ],
    recurrence: [
      { name: 'Júlia Corrêa',   status: 'Recorrente', orders: 6, spent: 488, score: 9, recency: '2 dias',  trend: 'up' },
      { name: 'Camila Andrade', status: 'Recorrente', orders: 5, spent: 412, score: 9, recency: '3 dias',  trend: 'up' },
    ],
    alerts: [
      { kind: 'warn',   title: 'Estoque baixo: Farinha T80', body: 'Restam ~12kg · fornada de sábado precisa de 28kg.', meta: 'há 1h' },
      { kind: 'info',   title: '8 pedidos aguardando',       body: 'Confirme com clientes para liberar a fila.',         meta: 'há 2h' },
    ],
    pausa: {
      healthy: true, activeRecurrent: 1, avgTicket: 42.50, repurchaseInterval: 5.2, repurchaseStatus: 'ótimo',
    },
    fornada: { when: 'Sábado, 16 de Maio', pedidos: 38, itens: 124, faturamento: 4280, capacidade: 0.68 },
  };
})();
