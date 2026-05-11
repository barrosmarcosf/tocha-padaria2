/* global React, Ic, NAV */

function Placeholder({ pageId }) {
  const item = window.NAV.find(n => n.id === pageId);
  const label = item ? item.label : pageId;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="sub" style={{ marginBottom: 6 }}>Admin</div>
          <h1>{label}</h1>
          <div className="sub">Página em construção — estrutura existente preservada.</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[1,2,3].map(i => (
          <div className="card hoverable" key={i}>
            <div className="card-head">
              <h3><Ic.chart/>Bloco {i}</h3>
              <span className="meta">placeholder</span>
            </div>
            <div style={{
              height: 120,
              borderRadius: 'var(--r)',
              background: 'repeating-linear-gradient(45deg, var(--panel-2), var(--panel-2) 8px, var(--panel-3) 8px, var(--panel-3) 16px)',
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)',
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
              conteúdo de {label}
            </div>
          </div>
        ))}
      </div>

      <div className="card hoverable mt" style={{ marginTop: 'var(--gap)' }}>
        <div className="card-head">
          <h3><Ic.list/>Tabela</h3>
          <span className="meta">demonstrativo</span>
        </div>
        <table className="tbl">
          <thead><tr><th>Item</th><th>Status</th><th style={{textAlign:'right'}}>Valor</th></tr></thead>
          <tbody>
            {[1,2,3,4,5].map(i => (
              <tr key={i}>
                <td>Registro {i}</td>
                <td><span className="tag gold">Ativo</span></td>
                <td className="num">R$ {(i * 42).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.Placeholder = Placeholder;
