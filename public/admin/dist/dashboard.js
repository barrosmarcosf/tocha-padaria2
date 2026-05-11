/* global React, Ic, KPI, AreaChart, Donut, brl, brlShort */
const {
  useState: useStD
} = React;
function ClientCardModal({
  client,
  onClose
}) {
  const initial = client.name.split(' ').map(s => s[0]).slice(0, 1).join('');
  const recurrent = client.status === 'Recorrente';
  return /*#__PURE__*/React.createElement("div", {
    className: "modal-backdrop",
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal client-card-modal",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    className: "modal-x",
    onClick: onClose
  }, "\xD7"), /*#__PURE__*/React.createElement("div", {
    className: "cc-avatar"
  }, /*#__PURE__*/React.createElement("span", null, initial)), /*#__PURE__*/React.createElement("h2", {
    className: "cc-name"
  }, client.name), /*#__PURE__*/React.createElement("div", {
    className: "cc-phone"
  }, "(21) 9", Math.floor(1000 + Math.random() * 8999), "-", Math.floor(1000 + Math.random() * 8999)), /*#__PURE__*/React.createElement("span", {
    className: `cc-tag ${recurrent ? 'rec' : 'oc'}`
  }, recurrent ? 'RECORRENTE' : 'OCASIONAL'), /*#__PURE__*/React.createElement("div", {
    className: "cc-stats"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "TOTAL GASTO"), /*#__PURE__*/React.createElement("b", null, brl(client.spent))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "PEDIDOS"), /*#__PURE__*/React.createElement("b", null, client.orders))), /*#__PURE__*/React.createElement("div", {
    className: "cc-score"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("small", null, "REC\xCANCIA"), /*#__PURE__*/React.createElement("b", null, client.recency, " atr\xE1s")), /*#__PURE__*/React.createElement("div", {
    className: "rt"
  }, /*#__PURE__*/React.createElement("small", null, "SCORE DE RECORR\xCANCIA"), /*#__PURE__*/React.createElement("b", {
    className: "cc-score-v"
  }, client.score, "/10"))), /*#__PURE__*/React.createElement("button", {
    className: "cc-msg"
  }, "Enviar Mensagem"), /*#__PURE__*/React.createElement("button", {
    className: "cc-back",
    onClick: onClose
  }, "Voltar ao Dashboard")));
}
const PERIOD_LABEL = {
  hoje: 'Hoje',
  ontem: 'Ontem',
  '7d': 'Últimos 7 dias',
  mes: 'Este mês',
  custom: 'Personalizado'
};
function Dashboard() {
  const D = window.DASH_DATA;
  const [period, setPeriod] = useStD('mes');
  const [openClient, setOpenClient] = useStD(null);
  const K = D.kpis;
  const today = D.today || new Date();
  const dateLabel = today.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "sub",
    style: {
      marginBottom: 6
    }
  }, dateLabel, " \xB7 ", PERIOD_LABEL[period]), /*#__PURE__*/React.createElement("h1", null, "Boas vindas, ", /*#__PURE__*/React.createElement("em", null, "Tocha Padaria")), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Pr\xF3xima fornada em ", /*#__PURE__*/React.createElement("b", null, "5 dias"), " \xB7 ", /*#__PURE__*/React.createElement("b", null, D.fornada.pedidos, " pedidos"), " confirmados")), /*#__PURE__*/React.createElement("div", {
    className: "range"
  }, [['hoje', 'Hoje'], ['ontem', 'Ontem'], ['7d', '7 dias'], ['mes', 'Este mês'], ['custom', 'Personalizar']].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: period === k ? 'on' : '',
    onClick: () => setPeriod(k)
  }, l)))), /*#__PURE__*/React.createElement("div", {
    className: "grid kpi-row"
  }, /*#__PURE__*/React.createElement(KPI, {
    label: "Faturamento",
    icon: Ic.chart,
    value: K.faturamento.value,
    prev: K.faturamento.prev,
    unit: "R$",
    decimals: 2,
    spark: K.faturamento.spark,
    color: "var(--c1)"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "Pedidos",
    icon: Ic.cart,
    value: K.pedidos.value,
    prev: K.pedidos.prev,
    spark: K.pedidos.spark,
    color: "var(--c3)"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "Ticket m\xE9dio",
    icon: Ic.card,
    value: K.ticket.value,
    prev: K.ticket.prev,
    unit: "R$",
    decimals: 2,
    spark: K.ticket.spark,
    color: "var(--c4)"
  }), /*#__PURE__*/React.createElement(KPI, {
    label: "Lucro",
    icon: Ic.bulb,
    value: K.lucro.value,
    prev: K.lucro.prev,
    unit: "R$",
    decimals: 2,
    spark: K.lucro.spark,
    color: "var(--c2)"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid row-2 mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.chart, null), "Faturamento ao longo do tempo"), /*#__PURE__*/React.createElement("div", {
    className: "legend"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    style: {
      background: 'var(--gold)'
    }
  }), "Este m\xEAs"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--ink-4)'
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      background: 'none',
      width: 16,
      height: 0,
      borderTop: '2px dashed var(--line-3)',
      borderRadius: 0,
      display: 'inline-block',
      verticalAlign: 'middle'
    }
  }), "M\xEAs anterior"))), /*#__PURE__*/React.createElement(AreaChart, {
    current: D.revenueSeries.current,
    previous: D.revenueSeries.previous
  })), /*#__PURE__*/React.createElement("div", {
    className: "card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.card, null), "Formas de pagamento"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "30 dias")), /*#__PURE__*/React.createElement(Donut, {
    data: D.payments
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid row-half mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.bread, null), "Top produtos vendidos"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "30 dias \xB7 ", D.topProducts.length, " itens")), (() => {
    const max = Math.max(...D.topProducts.map(p => p.gross));
    return D.topProducts.map((p, i) => /*#__PURE__*/React.createElement("div", {
      className: "bar-row",
      key: p.rank
    }, /*#__PURE__*/React.createElement("span", {
      className: "rk"
    }, "#", p.rank), /*#__PURE__*/React.createElement("div", {
      className: "meta-row"
    }, /*#__PURE__*/React.createElement("span", {
      className: "nm"
    }, p.name), /*#__PURE__*/React.createElement("span", {
      className: "ct"
    }, p.cat, " \xB7 ", p.qty, " un."), /*#__PURE__*/React.createElement("div", {
      className: "bar-track"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bar-fill",
      style: {
        width: `${p.gross / max * 100}%`,
        animationDelay: `${i * 60}ms`
      }
    }))), /*#__PURE__*/React.createElement("span", {
      className: "val"
    }, brlShort(p.gross), /*#__PURE__*/React.createElement("small", {
      style: {
        color: p.growth >= 0 ? 'var(--up)' : 'var(--down)'
      }
    }, p.growth >= 0 ? '↑' : '↓', " ", Math.abs(p.growth), "%"))));
  })()), /*#__PURE__*/React.createElement("div", {
    className: "card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.users, null), "Ranking de recorr\xEAncia"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Clientes mais leais")), /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Cliente"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Pedidos"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Gasto"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Score"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: 'right'
    }
  }, "Rec\xEAncia"))), /*#__PURE__*/React.createElement("tbody", null, D.recurrence.map((c, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: "row-clickable",
    onClick: () => setOpenClient(c)
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sb-avatar",
    style: {
      width: 28,
      height: 28,
      fontSize: 10,
      background: i === 0 ? 'linear-gradient(135deg, var(--gold), var(--gold-2))' : undefined,
      color: i === 0 ? '#1a1408' : undefined
    }
  }, c.name.split(' ').map(s => s[0]).slice(0, 2).join('')), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--ink)',
      fontWeight: 500
    },
    className: "client-link"
  }, c.name), /*#__PURE__*/React.createElement("span", {
    className: `tag ${c.status === 'Recorrente' ? 'gold' : ''}`
  }, c.status)))), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, c.orders), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, brlShort(c.spent)), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: c.score >= 8 ? 'var(--gold)' : c.score >= 6 ? 'var(--ink)' : 'var(--ink-3)'
    }
  }, c.score, "/10")), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, c.recency))))))), /*#__PURE__*/React.createElement("div", {
    className: "grid row-half mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card pause-card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.users, null), "Clientes em pausa"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "Recorrentes sem comprar h\xE1 +15 dias")), D.pausa.healthy ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "health"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pulse"
  }), /*#__PURE__*/React.createElement("b", null, "Base de clientes saud\xE1vel"), /*#__PURE__*/React.createElement("small", null, "Nenhum cliente recorrente em pausa")), /*#__PURE__*/React.createElement("div", {
    className: "pair"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mini"
  }, /*#__PURE__*/React.createElement("small", null, "Clientes recorrentes ativos"), /*#__PURE__*/React.createElement("b", null, D.pausa.activeRecurrent)), /*#__PURE__*/React.createElement("div", {
    className: "mini"
  }, /*#__PURE__*/React.createElement("small", null, "Ticket m\xE9dio (fiel)"), /*#__PURE__*/React.createElement("b", null, brl(D.pausa.avgTicket)))), /*#__PURE__*/React.createElement("div", {
    className: "highlight"
  }, /*#__PURE__*/React.createElement("small", null, "Intervalo de recompra"), /*#__PURE__*/React.createElement("b", null, "M\xE9dia de ", D.pausa.repurchaseInterval.toLocaleString('pt-BR'), " dias", ' ', /*#__PURE__*/React.createElement("em", null, "(", D.pausa.repurchaseStatus, ")")))) : /*#__PURE__*/React.createElement("div", {
    className: "empty-state"
  }, /*#__PURE__*/React.createElement(Ic.users, null), /*#__PURE__*/React.createElement("span", null, "Nenhum cliente em pausa"))), /*#__PURE__*/React.createElement("div", {
    className: "card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.chart, null), "Faturamento acumulado"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "30 dias")), /*#__PURE__*/React.createElement(CumulativeChart, {
    current: D.revenueSeries.current,
    previous: D.revenueSeries.previous
  }), /*#__PURE__*/React.createElement("div", {
    className: "legend",
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    style: {
      background: 'var(--gold)'
    }
  }), "M\xEAs atual", ' ', /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink)',
      marginLeft: 4
    }
  }, brlShort(D.revenueSeries.current.reduce((s, d) => s + d.value, 0)))), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    style: {
      background: 'var(--ink-4)'
    }
  }), "M\xEAs anterior", ' ', /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--ink-2)',
      marginLeft: 4
    }
  }, brlShort(D.revenueSeries.previous.reduce((s, d) => s + d.value, 0))))))), /*#__PURE__*/React.createElement("div", {
    className: "grid row-half mt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card fornada hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fornada-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "when"
  }, /*#__PURE__*/React.createElement(Ic.flame, {
    style: {
      display: 'inline',
      verticalAlign: 'middle',
      marginRight: 4
    }
  }), "Pr\xF3xima fornada"), /*#__PURE__*/React.createElement("h2", null, D.fornada.when), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: 'var(--ink-3)',
      marginTop: 2
    }
  }, "Janela de retirada: 9h \u2013 14h")), /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    title: "Ver detalhes"
  }, /*#__PURE__*/React.createElement(Ic.chev, null))), /*#__PURE__*/React.createElement("div", {
    className: "fornada-stats"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fornada-stat"
  }, /*#__PURE__*/React.createElement("small", null, "Pedidos"), /*#__PURE__*/React.createElement("b", null, D.fornada.pedidos)), /*#__PURE__*/React.createElement("div", {
    className: "fornada-stat"
  }, /*#__PURE__*/React.createElement("small", null, "Itens"), /*#__PURE__*/React.createElement("b", null, D.fornada.itens)), /*#__PURE__*/React.createElement("div", {
    className: "fornada-stat"
  }, /*#__PURE__*/React.createElement("small", null, "Receita"), /*#__PURE__*/React.createElement("b", null, brlShort(D.fornada.faturamento)))), /*#__PURE__*/React.createElement("div", {
    className: "fornada-progress"
  }, /*#__PURE__*/React.createElement("small", null, /*#__PURE__*/React.createElement("span", null, "Capacidade preenchida"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--gold)',
      fontWeight: 500
    }
  }, Math.round(D.fornada.capacidade * 100), "%")), /*#__PURE__*/React.createElement("div", {
    className: "progress-track"
  }, /*#__PURE__*/React.createElement("div", {
    className: "progress-fill",
    style: {
      width: `${D.fornada.capacidade * 100}%`
    }
  })))), /*#__PURE__*/React.createElement("div", {
    className: "card hoverable"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-head"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement(Ic.bell, null), "Alertas"), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, D.alerts.length, " novos")), /*#__PURE__*/React.createElement("div", {
    className: "alert-list"
  }, D.alerts.map((a, i) => /*#__PURE__*/React.createElement("div", {
    className: `alert ${a.kind}`,
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "a-ic"
  }, a.kind === 'info' ? /*#__PURE__*/React.createElement(Ic.info, null) : /*#__PURE__*/React.createElement(Ic.warn, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("b", null, a.title), /*#__PURE__*/React.createElement("small", null, a.body)), /*#__PURE__*/React.createElement("small", {
    style: {
      flexShrink: 0,
      color: 'var(--ink-4)',
      fontSize: 10
    }
  }, a.meta)))))), openClient && /*#__PURE__*/React.createElement(ClientCardModal, {
    client: openClient,
    onClose: () => setOpenClient(null)
  }));
}
function CumulativeChart({
  current,
  previous
}) {
  const w = 320,
    h = 140,
    padL = 8,
    padR = 8,
    padT = 12,
    padB = 18;
  const iw = w - padL - padR,
    ih = h - padT - padB;
  const cumA = [];
  let a = 0;
  current.forEach(d => {
    a += d.value;
    cumA.push(a);
  });
  const cumB = [];
  let b = 0;
  previous.forEach(d => {
    b += d.value;
    cumB.push(b);
  });
  const max = Math.max(cumA.at(-1), cumB.at(-1)) * 1.05;
  const n = cumA.length;
  const xp = i => padL + i / (n - 1) * iw;
  const yp = v => padT + ih - v / max * ih;
  const smooth = arr => arr.map((v, i) => {
    if (i === 0) return `M ${xp(i).toFixed(1)} ${yp(v).toFixed(1)}`;
    const cpx = ((xp(i - 1) + xp(i)) / 2).toFixed(1);
    return `C ${cpx} ${yp(arr[i - 1]).toFixed(1)} ${cpx} ${yp(v).toFixed(1)} ${xp(i).toFixed(1)} ${yp(v).toFixed(1)}`;
  }).join(' ');
  const pathA = smooth(cumA);
  const pathB = smooth(cumB);
  const area = `${pathA} L ${xp(n - 1).toFixed(1)} ${padT + ih} L ${padL} ${padT + ih} Z`;
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${w} ${h}`,
    style: {
      width: '100%',
      height: 140,
      display: 'block'
    }
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "cumAreaGrad",
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0%",
    stopColor: "var(--gold)",
    stopOpacity: "0.20"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "100%",
    stopColor: "var(--gold)",
    stopOpacity: "0"
  }))), /*#__PURE__*/React.createElement("path", {
    d: area,
    fill: "url(#cumAreaGrad)"
  }), /*#__PURE__*/React.createElement("path", {
    d: pathB,
    fill: "none",
    stroke: "var(--ink-4)",
    strokeWidth: "1.2",
    strokeDasharray: "3 4",
    opacity: "0.55"
  }), /*#__PURE__*/React.createElement("path", {
    d: pathA,
    fill: "none",
    stroke: "var(--gold)",
    strokeWidth: "4",
    strokeLinecap: "round",
    opacity: "0.10"
  }), /*#__PURE__*/React.createElement("path", {
    d: pathA,
    fill: "none",
    stroke: "var(--gold)",
    strokeWidth: "1.8",
    strokeLinecap: "round"
  }));
}
window.Dashboard = Dashboard;