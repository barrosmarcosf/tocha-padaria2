/* global React, Ic, _uploadImage */
const { useState: useStC, useEffect: useEffC, useCallback: useCbC, useRef: useRefC } = React;

function PageHead2({ title, subtitle, badge, right }) {
  return (
    <div className="page-head">
      <div>
        <div className="sub" style={{ marginBottom: 6 }}>Admin</div>
        <h1>
          {title}
          {badge && <span className="page-badge">{badge}</span>}
        </h1>
        <div className="sub">{subtitle}</div>
      </div>
      {right}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} aria-pressed={on}>
      <span className="toggle-knob"/>
    </button>
  );
}

function MethodRow({ icon, title, desc, on, set, accent }) {
  return (
    <div className="method-row">
      <div className="method-row-left">
        <input type="checkbox" className="cb-dim"/>
        <div className={`method-icon ${accent || ''}`}>{icon}</div>
        <div>
          <b>{title}</b>
          <small>{desc}</small>
        </div>
      </div>
      <Toggle on={on} onChange={set}/>
    </div>
  );
}

/* ========== FORMAS DE PAGAMENTO ========== */
function PagamentoPage() {
  const [stripeCC, setStripeCC] = useStC(false);
  const [stripePix, setStripePix] = useStC(false);
  const [mpCC, setMpCC] = useStC(true);
  const [mpPix, setMpPix] = useStC(true);
  const [loading, setLoading] = useStC(true);
  const [saving, setSaving] = useStC(false);
  const [msg, setMsg] = useStC('');

  useEffC(() => {
    window.apiGet('/api/admin/config')
      .then(d => {
        const pm = d?.siteContent?.payment_methods;
        if (pm && typeof pm === 'object') {
          setStripeCC(pm.stripe_card !== false && !!pm.stripe_card);
          setStripePix(pm.stripe_pix !== false && !!pm.stripe_pix);
          setMpCC(pm.mp_card !== false);
          setMpPix(pm.mp_pix !== false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
    setSaving(true); setMsg('');
    const value = { stripe_card: stripeCC, stripe_pix: stripePix, mp_card: mpCC, mp_pix: mpPix };
    window.apiPost('/api/admin/save-content', { key: 'payment_methods', value })
      .then(() => setMsg('Configurações salvas! Aplicadas imediatamente no checkout.'))
      .catch(e => setMsg('Erro: ' + e.message))
      .finally(() => setSaving(false));
  };

  return (
    <div className="page">
      <PageHead2 title="Formas de Pagamento" subtitle="Habilite ou desabilite os métodos oferecidos aos clientes no checkout."/>

      <div className="card gateway-card">
        <div className="gateway-strip"/>
        <div className="gateway-head">
          <div className="gateway-logo stripe">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M13.5 9.5c0-.7.6-1 1.5-1 1.3 0 3 .4 4.3 1.1V5.5C17.9 5 16.5 4.8 15 4.8c-3.7 0-6.2 2-6.2 5.2 0 5 6.9 4.2 6.9 6.4 0 .8-.7 1.1-1.7 1.1-1.5 0-3.4-.6-4.8-1.4v4.2c1.6.7 3.2 1 4.8 1 3.8 0 6.3-1.9 6.3-5.1 0-5.4-7-4.4-7-6.7z"/></svg>
          </div>
          <div className="gateway-meta">
            <h3>Stripe Business</h3>
            <span className="gw-status"><span className="dot-up"/> Gateway conectado</span>
          </div>
          <button className="btn-ghost btn-narrow" onClick={() => window.open('https://dashboard.stripe.com/', '_blank')}>Ajustes no Stripe</button>
        </div>
        <div className="section-title">Controle de métodos</div>
        <div className="method-list">
          <MethodRow icon={<Ic.card/>} title="Cartões de Crédito & Débito" desc="Bandeiras Visa, Mastercard, Elo, etc." on={stripeCC} set={setStripeCC}/>
          <MethodRow icon={<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 22 12 12 22 2 12Z"/></svg>} title="PIX Instantâneo" desc="Transferências diretas · Aprovação rápida" on={stripePix} set={setStripePix}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn-primary" onClick={handleSave} disabled={saving || loading}>{saving ? 'Salvando…' : 'Salvar configurações'}</button>
        </div>
      </div>

      <div className="card gateway-card mt" style={{ '--gateway-accent': 'oklch(0.72 0.13 220)' }}>
        <div className="gateway-strip" style={{ background: 'var(--gateway-accent)' }}/>
        <div className="gateway-head">
          <div className="gateway-logo mp" style={{ background: 'color-mix(in oklch, var(--gateway-accent) 16%, var(--panel-2))', color: 'var(--gateway-accent)' }}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 4c1.4 0 2.7.5 3.7 1.4-1 .4-2.3.6-3.7.6s-2.7-.2-3.7-.6C9.3 6.5 10.6 6 12 6zm0 12c-3.3 0-6-2.7-6-6 0-1 .2-1.9.6-2.7.7.4 1.6.7 2.6.9-.1.2-.2.5-.2.8 0 1.7 1.4 3 3 3s3-1.3 3-3c0-.3-.1-.6-.2-.8 1-.2 1.9-.5 2.6-.9.4.8.6 1.7.6 2.7 0 3.3-2.7 6-6 6z"/></svg>
          </div>
          <div className="gateway-meta">
            <h3>Mercado Pago</h3>
            <span className="gw-status"><span className="dot-up"/> Gateway conectado</span>
          </div>
          <button className="btn-ghost btn-narrow" onClick={() => window.open('https://www.mercadopago.com.br/settings/account', '_blank')}>Ajustes no MP</button>
        </div>
        <div className="section-title">Métodos Mercado Pago</div>
        <div className="method-list">
          <MethodRow icon={<Ic.card/>} title="Cartão de Crédito/Débito" desc="Checkout transparente · Desativa Stripe automaticamente" on={mpCC} set={setMpCC} accent="info"/>
          <MethodRow icon={<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 22 12 12 22 2 12Z"/></svg>} title="PIX" desc="QR Code automático via Mercado Pago" on={mpPix} set={setMpPix} accent="info"/>
        </div>

        <div className="info-box">
          <Ic.info/>
          <div>
            <b>Cartão MP e Stripe são mutuamente exclusivos</b> — ativar um desativa o outro automaticamente. PIX usa QR Code gerado pelo Mercado Pago.
          </div>
        </div>

        <div className="info-box muted mt-sm">
          <Ic.shield/>
          <div>
            <b>Aplicação Imediata & Segura.</b> O nosso backend se conecta com o Stripe e injeta os métodos na criação da sessão. Se você desabilitar um método aqui, <b>ele sequer será enviado para o processador de pagamento</b>, tornando qualquer injeção forçada impossível na camada de frontend.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn-primary" onClick={handleSave} disabled={saving || loading}>{saving ? 'Salvando…' : 'Salvar configurações'}</button>
        </div>
      </div>

      {msg && (
        <div style={{ textAlign: 'center', fontSize: 13, marginTop: 12, color: msg.startsWith('Erro') ? 'var(--down)' : 'var(--up)' }}>
          {msg}
        </div>
      )}
    </div>
  );
}

/* ========== HORÁRIO / CICLOS DE VENDA ========== */
function fmtForInput(dateStr) {
  if (!dateStr) return '';
  const [datePart, timePart] = dateStr.split('T');
  if (!datePart) return '';
  const [y, m, d] = datePart.split('-');
  const base = `${d}/${m}/${y}`;
  if (timePart) return `${base} ${timePart.slice(0,5)}`;
  return base;
}

function parseInputToISO(str) {
  if (!str) return '';
  const [datePart, timePart] = str.trim().split(' ');
  const parts = datePart.split('/');
  if (parts.length !== 3) return str;
  const [d, m, y] = parts;
  return timePart ? `${y}-${m}-${d}T${timePart}` : `${y}-${m}-${d}`;
}

function calcTimeLeft(endStr) {
  if (!endStr) return null;
  const end = new Date(endStr.includes('T') ? endStr : endStr + 'T23:59:59');
  const diff = end.getTime() - Date.now();
  if (diff <= 0) return 'Encerrado';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${days}d ${hours}h ${mins}min`;
}

function HorarioPage() {
  const [auto, setAuto] = useStC(true);
  const [loading, setLoading] = useStC(true);
  const [saving, setSaving] = useStC(false);
  const [savedMsg, setSavedMsg] = useStC('');
  const [config, setConfig] = useStC(null);

  const [curr, setCurr] = useStC({ prodDate: '', winStart: '', winEnd: '' });
  const [next, setNext] = useStC({ prodDate: '', winStart: '', winEnd: '' });

  const load = useCbC(() => {
    window.apiGet('/api/admin/config')
      .then(d => {
        const oh = d?.siteContent?.opening_hours || {};
        setConfig(oh);
        setAuto(!oh.manualBlock);
        if (oh.currentBatch) {
          setCurr({
            prodDate: fmtForInput(oh.currentBatch.bakeDate),
            winStart: fmtForInput(oh.currentBatch.start),
            winEnd:   fmtForInput(oh.currentBatch.end),
          });
        }
        if (oh.nextBatch) {
          setNext({
            prodDate: fmtForInput(oh.nextBatch.bakeDate),
            winStart: fmtForInput(oh.nextBatch.start),
            winEnd:   fmtForInput(oh.nextBatch.end),
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffC(() => { load(); }, [load]);

  const handleSave = () => {
    setSaving(true);
    setSavedMsg('');
    const updated = {
      ...(config || {}),
      manualBlock: !auto,
      currentBatch: {
        bakeDate: parseInputToISO(curr.prodDate),
        start:    parseInputToISO(curr.winStart),
        end:      parseInputToISO(curr.winEnd),
      },
      nextBatch: {
        bakeDate: parseInputToISO(next.prodDate),
        start:    parseInputToISO(next.winStart),
        end:      parseInputToISO(next.winEnd),
      },
    };
    window.apiPost('/api/admin/save-content', { key: 'opening_hours', value: updated })
      .then(() => { setConfig(updated); setSavedMsg('Configuração salva com sucesso!'); })
      .catch(e => setSavedMsg('Erro: ' + e.message))
      .finally(() => setSaving(false));
  };

  const currentEnd = config?.currentBatch?.end;
  const timeLeft = calcTimeLeft(currentEnd);
  const currentBakeLabel = curr.prodDate || '—';

  return (
    <div className="page">
      <PageHead2 title="Ciclos de Venda" subtitle="Gerencia janelas de pedidos e datas de produção."/>

      <div className="card op-auto">
        <div className="op-auto-icon">
          <Ic.spark/>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--display)', fontWeight: 400, fontSize: 18, color: 'var(--ink)' }}>Operação automática</h3>
          <small style={{ color: 'var(--ink-3)', fontSize: 12 }}>O fechamento manual ignora as janelas abaixo.</small>
        </div>
        <Toggle on={auto} onChange={setAuto}/>
      </div>

      {loading ? (
        <div className="empty-state" style={{ height: 160 }}><Ic.clock/><div>Carregando configuração…</div></div>
      ) : (
        <div className="grid mt" style={{ gridTemplateColumns: '1fr', gap: 18 }}>
          <CycleCard
            num="1" label="Fornada atual"
            values={curr} onChange={setCurr}
          />
          <CycleCard
            num="2" label="Próxima fornada"
            values={next} onChange={setNext}
          />
        </div>
      )}

      {!loading && (
        <div className="card mt status-card">
          <div className="status-card-row">
            <div className="status-pill"><span className="dot-up"/> Status calculado · <b>Fornada atual</b></div>
            <div className="status-text">
              <Ic.clock/> <b>Comunicação para o cliente:</b> Pedidos abertos para este sábado —{' '}
              <b style={{ color: 'var(--gold)' }}>{currentBakeLabel}</b>
              {timeLeft && <> — Encerra em <b style={{ color: 'var(--gold)' }}>{timeLeft}</b></>}
            </div>
          </div>
        </div>
      )}

      {savedMsg && (
        <div style={{ textAlign: 'center', color: savedMsg.startsWith('Erro') ? 'var(--down)' : 'var(--up)', fontSize: 13, marginTop: 12 }}>
          {savedMsg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
        <button className="btn-ghost" style={{ flex: 'none', padding: '8px 16px' }} onClick={load}>Cancelar</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </div>
  );
}

function CycleCard({ num, label, values, onChange }) {
  const set = (field) => (e) => onChange(prev => ({ ...prev, [field]: e.target.value }));
  return (
    <div className="card cycle-card">
      <div className="cycle-head">
        <span className="cycle-num">Ciclo {num}</span>
        <h3>{label}</h3>
      </div>
      <div className="cycle-field">
        <label>Data da produção <small>(exibida ao cliente)</small></label>
        <input className="date-input lg" type="text" value={values.prodDate} onChange={set('prodDate')} placeholder="DD/MM/AAAA"/>
      </div>
      <div className="grid row-2 cycle-fields">
        <div className="cycle-field">
          <label>Início da janela</label>
          <input className="date-input lg" type="text" value={values.winStart} onChange={set('winStart')} placeholder="DD/MM/AAAA HH:MM"/>
        </div>
        <div className="cycle-field">
          <label>Fim da janela</label>
          <input className="date-input lg" type="text" value={values.winEnd} onChange={set('winEnd')} placeholder="DD/MM/AAAA HH:MM"/>
        </div>
      </div>
    </div>
  );
}

/* ========== HOME PAGE EDITOR ========== */
const BANNER_DEFAULTS = [
  { kicker: 'Fermentação Natural', title: 'O pão que\ntransforma\no seu dia', desc: 'Cada pão nasce de levain vivo, farinha de qualidade e tempo; não tem atalho, tem respeito.', imageUrl: '', image_zoom: 1 },
  { kicker: 'Fornada de Sábado', title: 'Reserve sua\nfornada da\nsemana', desc: 'Pedidos abertos até sexta-feira às 16h. Retirada sábado a partir das 9h, ainda quente da pedra.', imageUrl: '', image_zoom: 1 },
];

function BannerEditor({ index, value, onChange, active, onSelect }) {
  const imgRef = useRefC(null);
  const [uploading, setUploading] = useStC(false);

  const handleImg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const url = await window._uploadImage(file);
      onChange({ ...value, imageUrl: url });
    } catch (err) { alert('Erro no upload: ' + err.message); }
    finally { setUploading(false); }
  };

  const set = (field) => (e) => onChange({ ...value, [field]: e.target.value });

  return (
    <div className={`card banner-card ${active ? 'on' : ''}`}>
      <div className="banner-card-head">
        <div>
          <span className="cycle-num">Banner {index}</span>
          {active && <span className="tag up" style={{ marginLeft: 8 }}>EM USO</span>}
        </div>
        <button className={`btn-${active ? 'ghost' : 'primary'} btn-narrow`} onClick={onSelect} disabled={active}>
          {active ? 'Selecionado' : 'Usar este banner'}
        </button>
      </div>

      <div className="grid hp-grid">
        <div className="hp-form">
          <div className="section-title">Conteúdo</div>

          <div className="form-row">
            <label>
              Texto curto superior
              <small className="ref-tag green">Ref. retângulo verde</small>
            </label>
            <input className="inp" value={value.kicker} onChange={set('kicker')}/>
          </div>

          <div className="form-row">
            <label>
              Título principal grande
              <small className="ref-tag red">Ref. retângulo vermelho</small>
            </label>
            <textarea className="inp" rows={3} value={value.title} onChange={set('title')}/>
            <small className="hint">Use asteriscos para destacar o texto em dourado. Ex: *transforma*</small>
          </div>

          <div className="form-row">
            <label>
              Texto descritivo
              <small className="ref-tag purple">Ref. retângulo roxo</small>
            </label>
            <textarea className="inp" rows={3} value={value.desc} onChange={set('desc')}/>
          </div>

          <div className="form-row">
            <label>Zoom da imagem</label>
            <input
              type="range"
              min="0.8" max="1.5" step="0.05"
              value={value.image_zoom ?? 1}
              onChange={(e) => onChange({ ...value, image_zoom: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--gold)' }}
            />
            <small className="hint">Zoom: {((value.image_zoom ?? 1) * 100).toFixed(0)}% — padrão 100%</small>
          </div>
        </div>

        <div className="hp-preview">
          <div className="section-title">Imagem principal</div>
          <div className="hp-image">
            <div className="hp-image-inner">
              {value.imageUrl ? (
                <img src={`/${value.imageUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}/>
              ) : (
                <svg viewBox="0 0 100 100" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--gold)' }}>
                  <ellipse cx="50" cy="55" rx="32" ry="20"/>
                  <path d="M22 55 Q 50 30 78 55"/>
                  <path d="M35 50 Q 50 60 65 50"/>
                </svg>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <b style={{ display: 'block', fontFamily: 'var(--display)', fontSize: 16, fontWeight: 400, color: 'var(--ink)', marginBottom: 4 }}>Imagem principal</b>
            <small style={{ color: 'var(--ink-4)', fontSize: 11 }}>Substitui a imagem de fundo</small>
            <div style={{ marginTop: 12 }}>
              <button
                className="btn-ghost btn-narrow"
                onClick={(e) => { e.stopPropagation(); imgRef.current?.click(); }}
                disabled={uploading}
              >
                {uploading ? 'Enviando…' : 'Substituir imagem'}
              </button>
              <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImg}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePageCfgPage() {
  const [active, setActive] = useStC(1);
  const [banners, setBanners] = useStC(BANNER_DEFAULTS.map(b => ({ ...b })));
  const [saving, setSaving] = useStC(false);
  const [msg, setMsg] = useStC('');

  const load = useCbC(() => {
    window.apiGet('/api/admin/config')
      .then(d => {
        const hp = d?.siteContent?.home_banners;
        if (hp) {
          if (hp.active) setActive(hp.active);
          if (Array.isArray(hp.banners)) {
            setBanners(hp.banners.map((b, i) => ({ ...BANNER_DEFAULTS[i], ...b })));
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffC(() => { load(); }, [load]);

  const handleBannerChange = (i, val) => {
    setBanners(prev => prev.map((b, idx) => idx === i ? val : b));
  };

  const handleSave = () => {
    setSaving(true);
    setMsg('');
    window.apiPost('/api/admin/save-content', { key: 'home_banners', value: { active, banners } })
      .then(() => setMsg('Home page atualizada com sucesso!'))
      .catch(e => setMsg('Erro: ' + e.message))
      .finally(() => setSaving(false));
  };

  return (
    <div className="page">
      <PageHead2 title="Configuração Home Page" subtitle="Configure ambos os banners e escolha qual será exibido na home do site."/>

      <div className="grid mt" style={{ gridTemplateColumns: '1fr', gap: 18 }}>
        {banners.map((b, i) => (
          <BannerEditor
            key={i}
            index={i + 1}
            value={b}
            onChange={(val) => handleBannerChange(i, val)}
            active={active === i + 1}
            onSelect={() => setActive(i + 1)}
          />
        ))}
      </div>

      {msg && (
        <div style={{ textAlign: 'center', fontSize: 13, marginTop: 12, color: msg.startsWith('Erro') ? 'var(--down)' : 'var(--up)' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
        <button className="btn-ghost btn-narrow" onClick={load}>Cancelar</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Atualizando…' : 'Atualizar Home Page'}</button>
      </div>
    </div>
  );
}

/* ========== SOBRE A LOJA ========== */
function LojaPage() {
  return (
    <div className="page">
      <PageHead2 title="Sobre a Loja" subtitle="Informações públicas exibidas no site da loja."/>

      <div className="card link-pill">
        <div>
          <small className="kv-l">Meu link</small>
          <a className="link-id" style={{ fontSize: 15 }}>https://tochapadaria.com</a>
        </div>
        <button className="btn-ghost btn-narrow">Editar</button>
      </div>

      <div className="card mt">
        <div className="section-title">Identidade</div>
        <div className="grid row-2">
          <div className="form-row">
            <label>Nome do estabelecimento</label>
            <input className="inp" defaultValue="TOCHA PADARIA"/>
          </div>
          <div className="form-row">
            <label>Estilo de culinária</label>
            <input className="inp" defaultValue="Padaria & Conveniência"/>
          </div>
        </div>
        <div className="form-row">
          <label>Título</label>
          <input className="inp" placeholder="Ex: Nossa História"/>
        </div>
        <div className="form-row">
          <label>Nossa história</label>
          <textarea className="inp" rows={5} placeholder="Conte a história da padaria…"/>
        </div>
      </div>

      <div className="card mt">
        <div className="section-title">Localização</div>
        <div className="form-row">
          <label>Endereço</label>
          <input className="inp" defaultValue="Av. Presidente Kennedy, 672 — Vila Jurandir, São João de Meriti."/>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button className="btn-primary">Salvar</button>
      </div>
    </div>
  );
}

window.PagamentoPage   = PagamentoPage;
window.HorarioPage     = HorarioPage;
window.HomePageCfgPage = HomePageCfgPage;
window.LojaPage        = LojaPage;
