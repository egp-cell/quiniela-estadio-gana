import { useState, useEffect } from 'react';
import { COLORS, SPONSOR } from '../lib/brand';

const COSTO = 3000;
const WHATSAPP_ORGANIZADOR = '525569161882';

const GRUPOS = {
  'A':[{n:'México',c:'mx'},{n:'Sudáfrica',c:'za'},{n:'Corea del Sur',c:'kr'},{n:'Chequia',c:'cz'}],
  'B':[{n:'Canada',c:'ca'},{n:'Bosnia',c:'ba'},{n:'Catar',c:'qa'},{n:'Suiza',c:'ch'}],
  'C':[{n:'Brasil',c:'br'},{n:'Marruecos',c:'ma'},{n:'Haití',c:'ht'},{n:'Escocia',c:'gb-sct'}],
  'D':[{n:'Estados Unidos',c:'us'},{n:'Paraguay',c:'py'},{n:'Australia',c:'au'},{n:'Turquía',c:'tr'}],
  'E':[{n:'Alemania',c:'de'},{n:'Curazao',c:'cw'},{n:'Costa de Marfil',c:'ci'},{n:'Ecuador',c:'ec'}],
  'F':[{n:'Países Bajos',c:'nl'},{n:'Japón',c:'jp'},{n:'Suecia',c:'se'},{n:'Túnez',c:'tn'}],
  'G':[{n:'Bélgica',c:'be'},{n:'Irán',c:'ir'},{n:'Egipto',c:'eg'},{n:'Nueva Zelanda',c:'nz'}],
  'H':[{n:'España',c:'es'},{n:'Uruguay',c:'uy'},{n:'Arabia Saudita',c:'sa'},{n:'Cabo Verde',c:'cv'}],
  'I':[{n:'Francia',c:'fr'},{n:'Senegal',c:'sn'},{n:'Noruega',c:'no'},{n:'Irak',c:'iq'}],
  'J':[{n:'Argentina',c:'ar'},{n:'Austria',c:'at'},{n:'Argelia',c:'dz'},{n:'Jordania',c:'jo'}],
  'K':[{n:'Portugal',c:'pt'},{n:'Colombia',c:'co'},{n:'Uzbekistán',c:'uz'},{n:'RD Congo',c:'cd'}],
  'L':[{n:'Inglaterra',c:'gb-eng'},{n:'Croacia',c:'hr'},{n:'Ghana',c:'gh'},{n:'Panamá',c:'pa'}]
};

export default function Home() {
  const [cantidad, setCantidad] = useState(1);
  const [stats, setStats] = useState({ totalQuinielas: 0, bolsa: 0 });
  const [topRanking, setTopRanking] = useState([]);
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '' });
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(null);
  const [reglamento, setReglamento] = useState(false);
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isMobile, setIsMobile] = useState(false);
 const [grupoAbierto, setGrupoAbierto] = useState(null);
  const [tablaModal, setTablaModal] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {});
    fetch('/api/tabla').then(r => r.json()).then(d => {
      if (d.exito) setTopRanking((d.ranking || []).slice(0, 5));
    });
    const t = setInterval(() => {
      const inicio = new Date('2026-06-11T13:00:00-06:00').getTime();
      const ahora = new Date().getTime();
      const diff = inicio - ahora;
      if (diff < 0) return;
      setCountdown({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000)
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const total = cantidad * COSTO;
  const bolsa = stats.bolsa || 0;

  async function enviarForm(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      const res = await fetch('/api/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cantidad })
      });
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); }
      catch (e) {
        alert('Error del servidor. Verifica configuración en Vercel.');
        setEnviando(false);
        return;
      }
      if (data.exito) {
        setExito(data);
        setForm({ nombre: '', email: '', telefono: '' });
        setCantidad(1);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error de conexión: ' + err.message);
    }
    setEnviando(false);
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: COLORS.fondoNeutro, minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ background: COLORS.primario, color: 'white', padding: isMobile ? '10px 12px' : '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: isMobile ? 6 : 10, position: 'sticky', top: 0, zIndex: 50 }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: 8, textDecoration: 'none', flexShrink: 0 }}>
          <img src={SPONSOR.logo} alt={SPONSOR.nombre} style={{ height: isMobile ? 38 : 48, width: 'auto', display: 'block' }} />
        </a>
        <div style={{ display: 'flex', gap: isMobile ? 6 : 10, flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button onClick={() => setReglamento(true)} style={{ padding: isMobile ? '6px 10px' : '8px 18px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? 11 : 13, whiteSpace: 'nowrap' }}>📖 {isMobile ? 'Reglas' : 'Reglamento'}</button>
         <button onClick={() => setTablaModal(true)} style={{ padding: isMobile ? '6px 10px' : '8px 18px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? 11 : 13, whiteSpace: 'nowrap' }}>🏆 Tabla</button>
          <a href="#registro" style={{ padding: isMobile ? '6px 10px' : '8px 18px', background: COLORS.acentoCTA, color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: isMobile ? 11 : 13, whiteSpace: 'nowrap' }}>Inscribirme</a>
          <a href="/jugar" style={{ padding: isMobile ? '8px 16px' : '10px 22px', background: COLORS.verdeExito, color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 800, fontSize: isMobile ? 12 : 14, boxShadow: '0 4px 12px rgba(29,158,117,0.4)', whiteSpace: 'nowrap' }}>🔐 Log In</a>
        </div>
      </div>

      <section style={{ background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', padding: isMobile ? '40px 20px 80px' : '60px 20px 100px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 30 : 40, alignItems: 'center' }}>
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <h1 style={{ fontSize: isMobile ? 38 : 56, fontWeight: 900, lineHeight: 1.05, marginBottom: 8 }}>Quiniela Mundial</h1>
              <div style={{ fontSize: isMobile ? 80 : 110, fontWeight: 900, lineHeight: 0.9, color: COLORS.dorado, marginBottom: 24 }}>2026</div>
              <p style={{ fontSize: isMobile ? 15 : 17, opacity: 0.9, marginBottom: 28 }}>Inscríbete, predice marcadores y compite por el primer lugar.</p>
              <a href="#registro" style={{ display: 'inline-block', padding: '14px 26px', background: COLORS.acentoCTA, color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>Inscribirme</a>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: isMobile ? 20 : 28 }}>
              <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.85, marginBottom: 16, textAlign: 'center' }}>⚽ INICIA EN</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: isMobile ? 6 : 10 }}>
                {[['Días', countdown.d], ['Horas', countdown.h], ['Min', countdown.m], ['Seg', countdown.s]].map(([l, v], i) => (
                  <div key={i} style={{ textAlign: 'center', padding: isMobile ? '10px 4px' : '14px 8px', background: 'rgba(255,255,255,0.12)', borderRadius: 12 }}>
                    <div style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, color: COLORS.dorado }}>{String(v).padStart(2, '0')}</div>
                    <div style={{ fontSize: isMobile ? 9 : 10, opacity: 0.85, textTransform: 'uppercase' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ background: 'white', maxWidth: 1000, margin: isMobile ? '-40px 16px 0' : '-50px auto 0', borderRadius: 20, padding: isMobile ? 20 : 32, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 16 : 24, position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#888', letterSpacing: 1.5, fontWeight: 600 }}>INSCRIPCIÓN</div>
          <div style={{ fontSize: isMobile ? 28 : 32, fontWeight: 800, color: COLORS.azulDetalle }}>$3,000 MXN</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#888', letterSpacing: 1.5, fontWeight: 600 }}>QUINIELAS INSCRITAS</div>
          <div style={{ fontSize: isMobile ? 28 : 32, fontWeight: 800, color: COLORS.azulDetalle }}>{stats.totalQuinielas}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#888', letterSpacing: 1.5, fontWeight: 600 }}>BOLSA ACTUAL</div>
          <div style={{ fontSize: isMobile ? 28 : 32, fontWeight: 800, color: COLORS.verdeExito }}>${bolsa.toLocaleString()}</div>
        </div>
      </div>

      <section style={{ padding: isMobile ? '60px 16px' : '80px 20px', background: `linear-gradient(180deg, ${COLORS.fondoNeutro}, #EBEEF3)` }}>
        <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, textAlign: 'center', color: COLORS.azulDetalle, marginBottom: isMobile ? 28 : 40 }}>Los 12 grupos del Mundial</h2>
        {isMobile ? (
          <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.keys(GRUPOS).map(letra => {
              const abierto = grupoAbierto === letra;
              return (
                <div key={letra} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
                  <button onClick={() => setGrupoAbierto(abierto ? null : letra)} style={{ width: '100%', background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', padding: '16px 18px', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, fontFamily: 'inherit' }}>
                    <span>Grupo {letra}</span>
                    <span style={{ fontSize: 18, transform: abierto ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                  </button>
                  {abierto && (
                    <div>
                      {GRUPOS[letra].map((eq, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderTop: i === 0 ? 'none' : '1px solid #F0F2F5' }}>
                          <img src={`https://flagcdn.com/w80/${eq.c}.png`} style={{ width: 32, height: 22, borderRadius: 3 }} />
                          <span style={{ fontSize: 14 }}>{eq.n}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {Object.keys(GRUPOS).map(letra => (
              <div key={letra} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
                <div style={{ background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', padding: '14px 18px', fontWeight: 800 }}>Grupo {letra}</div>
                {GRUPOS[letra].map((eq, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px' }}>
                    <img src={`https://flagcdn.com/w80/${eq.c}.png`} style={{ width: 32, height: 22, borderRadius: 3 }} />
                    <span style={{ fontSize: 14 }}>{eq.n}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={{ background: `linear-gradient(180deg, ${COLORS.azulDetalle}, #0C447C)`, color: 'white', padding: isMobile ? '50px 16px' : '60px 20px' }}>
        <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, textAlign: 'center', marginBottom: isMobile ? 24 : 32 }}>Premios del Mundial</h2>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 24, padding: isMobile ? 28 : 40, marginBottom: 24 }}>
          <div style={{ fontSize: 12, letterSpacing: 3, opacity: 0.7, marginBottom: 12 }}>BOLSA ACUMULADA</div>
          <div style={{ fontSize: isMobile ? 44 : 64, fontWeight: 900, color: COLORS.dorado }}>${bolsa.toLocaleString()}</div>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[['🥇', 'PRIMER LUGAR', 0.56, 56, COLORS.dorado], ['🥈', 'SEGUNDO LUGAR', 0.23, 23, '#E0E0E0'], ['🥉', 'TERCER LUGAR', 0.14, 14, '#CD9C5C']].map(([ic, t, p, pct, c], i) => (
            <div key={i} style={{ borderRadius: 20, padding: isMobile ? 20 : 28, textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 40 }}>{ic}</div>
              <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.8 }}>{t}</div>
              <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 800, color: c }}>${Math.round(bolsa * p).toLocaleString()}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{pct}% de la bolsa</div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 900, margin: '24px auto 0', textAlign: 'center', fontSize: 13, opacity: 0.7 }}>
          Comisión del organizador: 7% de la bolsa
        </div>
      </section>

      <section style={{ padding: isMobile ? '60px 16px' : '80px 20px', background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#888', letterSpacing: 3, fontWeight: 700, marginBottom: 12 }}>PATROCINADOR OFICIAL</div>
          <div style={{ display: 'inline-block', padding: isMobile ? 20 : 28, background: 'white', borderRadius: 20, border: `2px solid ${COLORS.primario}`, marginBottom: 20 }}>
            <img src={SPONSOR.logo} alt={SPONSOR.nombre} style={{ height: isMobile ? 110 : 140, width: 'auto', display: 'block' }} />
          </div>
          <h2 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: COLORS.azulDetalle, marginBottom: 14 }}>{SPONSOR.nombre} aporta ${SPONSOR.aporteBolsa.toLocaleString()} MXN a la bolsa</h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color: '#555', maxWidth: 640, margin: '0 auto 24px' }}>
            Gracias a {SPONSOR.nombre}, patrocinador oficial de la Quiniela Mundial 2026, la bolsa se incrementa con un aporte directo para los ganadores. ¡Conócelos!
          </p>
          <a href={SPONSOR.url} target="_blank" rel="noreferrer noopener" style={{ display: 'inline-block', padding: '14px 28px', background: COLORS.acentoCTA, color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>Visitar {SPONSOR.nombre} →</a>
        </div>
      </section>

      <section id="registro" style={{ padding: isMobile ? '60px 16px' : '80px 20px', background: COLORS.fondoNeutro }}>
        <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, textAlign: 'center', color: COLORS.azulDetalle, marginBottom: isMobile ? 28 : 40 }}>Inscríbete</h2>
        <form onSubmit={enviarForm} style={{ maxWidth: 600, margin: '0 auto', background: 'white', padding: isMobile ? 24 : 40, borderRadius: 24, border: '1px solid #E0E0E0' }}>
          <input required placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={{ width: '100%', padding: 14, marginBottom: 14, border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 15, boxSizing: 'border-box' }} />
          <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: 14, marginBottom: 14, border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 15, boxSizing: 'border-box' }} />
          <input required placeholder="WhatsApp" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} style={{ width: '100%', padding: 14, marginBottom: 14, border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 15, boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: COLORS.fondoNeutro, borderRadius: 12, marginBottom: 16 }}>
            <button type="button" onClick={() => setCantidad(Math.max(1, cantidad - 1))} style={{ width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${COLORS.primario}`, background: 'white', color: COLORS.primario, fontSize: 22, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>−</button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.azulDetalle }}>{cantidad}</div>
              <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>quinielas</div>
            </div>
            <button type="button" onClick={() => setCantidad(Math.min(20, cantidad + 1))} style={{ width: 44, height: 44, borderRadius: 10, border: `1.5px solid ${COLORS.primario}`, background: 'white', color: COLORS.primario, fontSize: 22, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>+</button>
          </div>
          <div style={{ background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', borderRadius: 14, padding: isMobile ? 18 : 22, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13 }}>Total a pagar</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{cantidad} × ${COSTO.toLocaleString()}</div>
            </div>
            <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, color: COLORS.dorado }}>${total.toLocaleString()}</div>
          </div>
          <button type="submit" disabled={enviando} style={{ width: '100%', padding: 18, background: `linear-gradient(135deg, ${COLORS.acentoCTA}, ${COLORS.acentoCTAOscuro})`, color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            {enviando ? 'Procesando...' : 'Continuar al pago →'}
          </button>
        </form>
      </section>

      {exito && (
        <div onClick={() => setExito(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, maxWidth: 500, width: '100%', padding: isMobile ? 28 : 40, textAlign: 'center' }}>
            <div style={{ fontSize: 64, color: COLORS.verdeExito, marginBottom: 16 }}>✓</div>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: COLORS.azulDetalle, marginBottom: 12 }}>¡Registro exitoso!</h2>
            <p style={{ color: '#666', marginBottom: 24, fontSize: isMobile ? 14 : 16 }}>Ahora paga en MoneyPool. Cuando se confirme tu pago recibirás tu usuario y password por WhatsApp.</p>
            <a href={exito.linkMoneyPool} target="_blank" rel="noreferrer" style={{ display: 'block', padding: 16, background: `linear-gradient(135deg, ${COLORS.acentoCTA}, ${COLORS.acentoCTAOscuro})`, color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 700, marginBottom: 12 }}>Pagar ${exito.monto.toLocaleString()} en MoneyPool</a>
            <button onClick={() => setExito(null)} style={{ padding: '10px 20px', background: '#F0F2F5', color: '#666', border: 'none', borderRadius: 10, cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}
{tablaModal && (
        <div onClick={() => setTablaModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, maxWidth: 700, width: '100%', padding: isMobile ? 24 : 40, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: COLORS.azulDetalle, marginBottom: 4 }}>🏆 Tabla de Líderes</h2>
            <p style={{ color: '#666', marginBottom: 20, fontSize: 13 }}>{topRanking.length > 0 ? `Mostrando los primeros 5 de ${stats.totalQuinielas} quinielas` : 'Aún no hay líderes'}</p>

            {topRanking.length === 0 ? (
              <div style={{ background: COLORS.fondoNeutro, borderRadius: 14, padding: 40, textAlign: 'center', border: '1px solid #E0E0E0', marginBottom: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚽</div>
                <div style={{ fontWeight: 700, color: COLORS.azulDetalle, fontSize: 16, marginBottom: 8 }}>Aún no hay líderes</div>
                <div style={{ fontSize: 13, color: '#666' }}>Cuando empiece el Mundial y se capturen los primeros resultados, aquí verás el ranking en vivo.</div>
              </div>
            ) : (
              <div style={{ background: COLORS.fondoNeutro, borderRadius: 14, overflow: 'hidden', border: '1px solid #E0E0E0', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 60px', padding: '12px 14px', background: 'white', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', borderBottom: '1px solid #E0E0E0' }}>
                  <div style={{ textAlign: 'center' }}>Pos</div>
                  <div>Quiniela</div>
                  <div style={{ textAlign: 'center' }}>Pts</div>
                </div>
                {topRanking.map(q => {
                  const colores = q.posicion === 1 ? { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', txt: 'white', emoji: '🥇' }
                                : q.posicion === 2 ? { bg: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', txt: 'white', emoji: '🥈' }
                                : q.posicion === 3 ? { bg: 'linear-gradient(135deg, #CD7F32, #A0522D)', txt: 'white', emoji: '🥉' }
                                : { bg: '#E0E0E0', txt: '#666', emoji: '' };
                  return (
                    <div key={q.id} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 60px', padding: '14px', borderBottom: '1px solid #E8E8E8', alignItems: 'center', background: 'white' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: colores.bg, color: colores.txt, fontWeight: 800, fontSize: 12 }}>
                          {colores.emoji || `#${q.posicion}`}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: COLORS.azulDetalle, fontSize: 13 }}>{q.nombreQuiniela}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>{q.nombreUsuario}</div>
                      </div>
                      <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 900, color: COLORS.azulDetalle }}>{q.puntos}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <a href="/tabla" style={{ display: 'block', padding: 14, background: COLORS.primario, color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14, textAlign: 'center', marginBottom: 10 }}>Ver tabla completa →</a>
            <button onClick={() => setTablaModal(false)} style={{ width: '100%', padding: 14, background: '#F0F2F5', color: '#666', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}
      {reglamento && (
        <div onClick={() => setReglamento(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, maxWidth: 600, width: '100%', padding: isMobile ? 24 : 40, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: COLORS.azulDetalle, marginBottom: 4 }}>📖 Reglamento</h2>
            <p style={{ color: '#666', marginBottom: 24, fontSize: 13 }}>Quiniela Mundial 2026 · Estadio Gana · Lee bien antes de inscribirte</p>

            <h3 style={{ color: COLORS.azulDetalle, fontSize: 17, fontWeight: 800, marginTop: 20, marginBottom: 10 }}>💰 Inscripción</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Costo:</b> $3,000 MXN por quiniela</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Quinielas por persona:</b> ilimitadas (puedes meter varias y aumentas tus chances)</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Pago:</b> únicamente vía MoneyPool (recibirás el link al inscribirte)</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Confirmación:</b> el organizador valida tu pago y te envía usuario y password por WhatsApp</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Cierre de inscripciones:</b> 10 de junio 2026 (un día antes del partido inaugural)</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Inscripciones tardías:</b> aceptadas durante el torneo, pero solo cuentan los partidos que aún no hayan iniciado</li>
            </ul>

            <h3 style={{ color: COLORS.azulDetalle, fontSize: 17, fontWeight: 800, marginTop: 24, marginBottom: 10 }}>🎯 Sistema de puntos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div style={{ padding: 14, background: '#FAEEDA', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#854F0B' }}>3 pts</div>
                <div style={{ fontSize: 11, color: '#633806', textTransform: 'uppercase', fontWeight: 600 }}>Acertar ganador o empate</div>
              </div>
              <div style={{ padding: 14, background: '#FAEEDA', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#854F0B' }}>5 pts</div>
                <div style={{ fontSize: 11, color: '#633806', textTransform: 'uppercase', fontWeight: 600 }}>Marcador exacto</div>
              </div>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Resultado válido:</b> únicamente el marcador al minuto 90 (no cuenta tiempo extra ni penales)</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Marcador exacto incluye los 3 pts:</b> aciertas marcador exacto = 5 pts (no se suman aparte)</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Cálculo:</b> los puntos se calculan automáticamente al capturarse el resultado oficial</li>
            </ul>

            <h3 style={{ color: COLORS.azulDetalle, fontSize: 17, fontWeight: 800, marginTop: 24, marginBottom: 10 }}>⚽ Pronósticos</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Cuándo pronosticar:</b> en cualquier momento antes del inicio de cada partido</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Modificaciones:</b> puedes editar tu pronóstico hasta el minuto en que arranca el partido</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Bloqueo automático:</b> al iniciar cada partido, el pronóstico se cierra y ya no se puede cambiar</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Auto-guardado:</b> tus pronósticos se guardan solos cuando llenas ambos marcadores</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Eliminatorias:</b> los partidos de fase final se desbloquean cuando se conozcan los equipos clasificados</li>
            </ul>

            <h3 style={{ color: COLORS.azulDetalle, fontSize: 17, fontWeight: 800, marginTop: 24, marginBottom: 10 }}>🏆 Premios</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>1er lugar:</b> 56% de la bolsa total</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>2do lugar:</b> 23% de la bolsa total</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>3er lugar:</b> 14% de la bolsa total</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Comisión organizador:</b> 7% (cubre operación y mantenimiento de la plataforma)</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>Pago de premios:</b> tras la final del Mundial. El organizador notificará a los ganadores por WhatsApp para coordinar la transferencia</li>
            </ul>

            <h3 style={{ color: COLORS.azulDetalle, fontSize: 17, fontWeight: 800, marginTop: 24, marginBottom: 10 }}>⚖️ Empates en el ranking</h3>
            <p style={{ fontSize: 13, color: '#444', marginBottom: 10 }}>Si dos o más quinielas terminan con el mismo total de puntos, se desempata así:</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>1.</b> Más marcadores exactos durante todo el torneo</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>2.</b> Más aciertos en partidos de eliminatoria</li>
              <li style={{ padding: '8px 12px', background: COLORS.fondoNeutro, borderLeft: `3px solid ${COLORS.primario}`, borderRadius: 4, marginBottom: 6, fontSize: 13 }}><b>3.</b> Si persiste el empate, el premio se reparte en partes iguales</li>
            </ul>

            <h3 style={{ color: COLORS.azulDetalle, fontSize: 17, fontWeight: 800, marginTop: 24, marginBottom: 10 }}>❓ Preguntas frecuentes</h3>
            <div style={{ background: COLORS.fondoNeutro, padding: 14, borderRadius: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.azulDetalle, marginBottom: 4 }}>¿Qué pasa si un partido se cancela o se aplaza?</div>
              <div style={{ fontSize: 13, color: '#555' }}>Si la FIFA cancela un partido, se anula del cálculo de puntos. Si se reprograma, los pronósticos siguen vigentes para la nueva fecha.</div>
            </div>
            <div style={{ background: COLORS.fondoNeutro, padding: 14, borderRadius: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.azulDetalle, marginBottom: 4 }}>¿Puedo registrar varias quinielas con nombres distintos?</div>
              <div style={{ fontSize: 13, color: '#555' }}>Sí. Puedes inscribir 2, 3 o las que quieras y cada una compite por separado. Aumentas tus chances de ganar.</div>
            </div>
            <div style={{ background: COLORS.fondoNeutro, padding: 14, borderRadius: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.azulDetalle, marginBottom: 4 }}>¿Qué pasa si no pronostico un partido?</div>
              <div style={{ fontSize: 13, color: '#555' }}>Ese partido te da 0 puntos. No hay penalización extra, simplemente pierdes la oportunidad de sumar.</div>
            </div>
            <div style={{ background: COLORS.fondoNeutro, padding: 14, borderRadius: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.azulDetalle, marginBottom: 4 }}>¿Puedo cambiar mi pronóstico después?</div>
              <div style={{ fontSize: 13, color: '#555' }}>Sí, hasta el momento exacto en que comienza el partido. Después se bloquea automáticamente.</div>
            </div>
            <div style={{ background: COLORS.fondoNeutro, padding: 14, borderRadius: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.azulDetalle, marginBottom: 4 }}>¿Cómo se garantiza que nadie pueda hacer trampa?</div>
              <div style={{ fontSize: 13, color: '#555' }}>El sistema bloquea cualquier modificación al iniciar el partido y todos los movimientos quedan registrados con fecha y hora.</div>
            </div>

            <h3 style={{ color: COLORS.azulDetalle, fontSize: 17, fontWeight: 800, marginTop: 24, marginBottom: 10 }}>📞 Contacto</h3>
            <p style={{ fontSize: 13, color: '#444', marginBottom: 10 }}>Para cualquier duda, problema con tu inscripción o pago, contacta al organizador:</p>
            <a href={`https://wa.me/${WHATSAPP_ORGANIZADOR}?text=${encodeURIComponent('Hola Emiliano, tengo una duda sobre la Quiniela Mundial 2026 · Estadio Gana:')}`} target="_blank" rel="noreferrer" style={{ display: 'block', padding: 14, background: '#25D366', color: 'white', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14, textAlign: 'center', marginBottom: 8 }}>📱 Contactar por WhatsApp</a>
            <p style={{ fontSize: 11, color: '#888', textAlign: 'center' }}>Emiliano · +52 55 6916 1882</p>

            <button onClick={() => setReglamento(false)} style={{ marginTop: 24, width: '100%', padding: 14, background: COLORS.primario, color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}

      <footer style={{ background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'white', padding: 16, borderRadius: 16, marginBottom: 16 }}>
          <img src={SPONSOR.logo} alt={SPONSOR.nombre} style={{ height: 60, width: 'auto', display: 'block' }} />
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 6 }}>Patrocinador oficial · {SPONSOR.nombre}</div>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>⚽ Quiniela Mundial 2026 · Estadio Gana</div>
        <a href={`https://wa.me/${WHATSAPP_ORGANIZADOR}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(255,255,255,0.15)', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>📱 Contactar al organizador</a>
        <p style={{ fontSize: 11, opacity: 0.6, marginTop: 16 }}>Sitio no afiliado a la FIFA. Quiniela privada.</p>
      </footer>
    </div>
  );
}
