import { useState, useEffect } from 'react';

const COSTO = 3000;
const GRUPOS = {
  'A':[{n:'Mexico',c:'mx'},{n:'Sudafrica',c:'za'},{n:'Corea del Sur',c:'kr'},{n:'Chequia',c:'cz'}],
  'B':[{n:'Canada',c:'ca'},{n:'Bosnia',c:'ba'},{n:'Catar',c:'qa'},{n:'Suiza',c:'ch'}],
  'C':[{n:'Brasil',c:'br'},{n:'Marruecos',c:'ma'},{n:'Haiti',c:'ht'},{n:'Escocia',c:'gb-sct'}],
  'D':[{n:'Estados Unidos',c:'us'},{n:'Paraguay',c:'py'},{n:'Australia',c:'au'},{n:'Turquia',c:'tr'}],
  'E':[{n:'Alemania',c:'de'},{n:'Curazao',c:'cw'},{n:'Costa de Marfil',c:'ci'},{n:'Ecuador',c:'ec'}],
  'F':[{n:'Paises Bajos',c:'nl'},{n:'Japon',c:'jp'},{n:'Suecia',c:'se'},{n:'Tunez',c:'tn'}],
  'G':[{n:'Belgica',c:'be'},{n:'Iran',c:'ir'},{n:'Egipto',c:'eg'},{n:'Nueva Zelanda',c:'nz'}],
  'H':[{n:'Espana',c:'es'},{n:'Uruguay',c:'uy'},{n:'Arabia Saudita',c:'sa'},{n:'Cabo Verde',c:'cv'}],
  'I':[{n:'Francia',c:'fr'},{n:'Senegal',c:'sn'},{n:'Noruega',c:'no'},{n:'Iraq',c:'iq'}],
  'J':[{n:'Argentina',c:'ar'},{n:'Austria',c:'at'},{n:'Argelia',c:'dz'},{n:'Jordania',c:'jo'}],
  'K':[{n:'Portugal',c:'pt'},{n:'Colombia',c:'co'},{n:'Uzbekistan',c:'uz'},{n:'RD Congo',c:'cd'}],
  'L':[{n:'Inglaterra',c:'gb-eng'},{n:'Croacia',c:'hr'},{n:'Ghana',c:'gh'},{n:'Panama',c:'pa'}]
};

export default function Home() {
  const [cantidad, setCantidad] = useState(1);
  const [stats, setStats] = useState({ totalQuinielas: 0, bolsa: 0 });
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '' });
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(null);
  const [reglamento, setReglamento] = useState(false);
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(setStats).catch(() => {});
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
        alert('Error del servidor. Verifica configuracion en Vercel.');
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
      alert('Error de conexion: ' + err.message);
    }
    setEnviando(false);
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#F8F9FB', minHeight: '100vh' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ background: '#021A33', color: 'white', padding: '12px', display: 'flex', justifyContent: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => setReglamento(true)} style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>📖 Reglamento</button>
        <a href="/jugar" style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>🔐 Entrar</a>
        <a href="#registro" style={{ padding: '8px 18px', background: '#FAC775', color: '#412402', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>Inscribirme ahora</a>
      </div>

      <section style={{ background: 'linear-gradient(135deg, #042C53, #0C447C)', color: 'white', padding: '60px 20px 100px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.05, marginBottom: 8 }}>Quiniela Mundial</h1>
              <div style={{ fontSize: 110, fontWeight: 900, lineHeight: 0.9, color: '#FAC775', marginBottom: 24 }}>2026</div>
              <p style={{ fontSize: 17, opacity: 0.85, marginBottom: 28 }}>Inscribete, predice marcadores y compite por el primer lugar.</p>
              <a href="#registro" style={{ padding: '14px 26px', background: '#FAC775', color: '#412402', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>Inscribirme</a>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
              <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.7, marginBottom: 16, textAlign: 'center' }}>⚽ INICIA EN</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {[['Dias', countdown.d], ['Horas', countdown.h], ['Min', countdown.m], ['Seg', countdown.s]].map(([l, v], i) => (
                  <div key={i} style={{ textAlign: 'center', padding: '14px 8px', background: 'rgba(255,255,255,0.08)', borderRadius: 12 }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#FAC775' }}>{String(v).padStart(2, '0')}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, textTransform: 'uppercase' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ background: 'white', maxWidth: 1000, margin: '-50px auto 0', borderRadius: 20, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#888', letterSpacing: 1.5, fontWeight: 600 }}>INSCRIPCION</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#BA7517' }}>$3,000 MXN</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#888', letterSpacing: 1.5, fontWeight: 600 }}>QUINIELAS INSCRITAS</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#042C53' }}>{stats.totalQuinielas}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#888', letterSpacing: 1.5, fontWeight: 600 }}>BOLSA ACTUAL</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#1D9E75' }}>${bolsa.toLocaleString()}</div>
        </div>
      </div>

      <section style={{ padding: '80px 20px', background: 'linear-gradient(180deg, #F8F9FB, #EBEEF3)' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: 'center', color: '#042C53', marginBottom: 40 }}>Los 12 grupos del Mundial</h2>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {Object.keys(GRUPOS).map(letra => (
            <div key={letra} style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
              <div style={{ background: 'linear-gradient(135deg, #042C53, #0C447C)', color: 'white', padding: '14px 18px', fontWeight: 800 }}>Grupo {letra}</div>
              {GRUPOS[letra].map((eq, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px' }}>
                  <img src={`https://flagcdn.com/w80/${eq.c}.png`} style={{ width: 32, height: 22, borderRadius: 3 }} />
                  <span style={{ fontSize: 14 }}>{eq.n}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'linear-gradient(180deg, #042C53, #0C447C)', color: 'white', padding: '60px 20px' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: 'center', marginBottom: 32 }}>Premios del Mundial</h2>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 24, padding: 40, marginBottom: 24 }}>
          <div style={{ fontSize: 12, letterSpacing: 3, opacity: 0.7, marginBottom: 12 }}>BOLSA ACUMULADA</div>
          <div style={{ fontSize: 64, fontWeight: 900, color: '#FAC775' }}>${bolsa.toLocaleString()}</div>
        </div>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[['🥇', 'PRIMER LUGAR', 0.56, 56, '#FAC775'], ['🥈', 'SEGUNDO LUGAR', 0.23, 23, '#E0E0E0'], ['🥉', 'TERCER LUGAR', 0.14, 14, '#CD9C5C']].map(([ic, t, p, pct, c], i) => (
            <div key={i} style={{ borderRadius: 20, padding: 28, textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 40 }}>{ic}</div>
              <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.8 }}>{t}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: c }}>${Math.round(bolsa * p).toLocaleString()}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{pct}% de la bolsa</div>
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 900, margin: '24px auto 0', textAlign: 'center', fontSize: 13, opacity: 0.7 }}>
          Comision del organizador: 7% de la bolsa
        </div>
      </section>

      <section id="registro" style={{ padding: '80px 20px', background: 'white' }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: 'center', color: '#042C53', marginBottom: 40 }}>Inscribete</h2>
        <form onSubmit={enviarForm} style={{ maxWidth: 600, margin: '0 auto', background: 'white', padding: 40, borderRadius: 24, border: '1px solid #E0E0E0' }}>
          <input required placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={{ width: '100%', padding: 14, marginBottom: 14, border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 15 }} />
          <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: '100%', padding: 14, marginBottom: 14, border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 15 }} />
          <input required placeholder="WhatsApp" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} style={{ width: '100%', padding: 14, marginBottom: 14, border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 15 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#F8F9FB', borderRadius: 12, marginBottom: 16 }}>
            <button type="button" onClick={() => setCantidad(Math.max(1, cantidad - 1))} style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #042C53', background: 'white', color: '#042C53', fontSize: 22, fontWeight: 700, cursor: 'pointer' }}>−</button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#042C53' }}>{cantidad}</div>
              <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase' }}>quinielas</div>
            </div>
            <button type="button" onClick={() => setCantidad(Math.min(20, cantidad + 1))} style={{ width: 44, height: 44, borderRadius: 10, border: '1.5px solid #042C53', background: 'white', color: '#042C53', fontSize: 22, fontWeight: 700, cursor: 'pointer' }}>+</button>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #042C53, #0C447C)', color: 'white', borderRadius: 14, padding: 22, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13 }}>Total a pagar</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{cantidad} × ${COSTO.toLocaleString()}</div>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#FAC775' }}>${total.toLocaleString()}</div>
          </div>
          <button type="submit" disabled={enviando} style={{ width: '100%', padding: 18, background: 'linear-gradient(135deg, #FAC775, #EF9F27)', color: '#412402', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            {enviando ? 'Procesando...' : 'Continuar al pago →'}
          </button>
        </form>
      </section>

      {exito && (
        <div onClick={() => setExito(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, maxWidth: 500, width: '100%', padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 64, color: '#1D9E75', marginBottom: 16 }}>✓</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#042C53', marginBottom: 12 }}>Registro exitoso!</h2>
            <p style={{ color: '#666', marginBottom: 24 }}>Ahora paga en MoneyPool. Cuando se confirme tu pago recibiras tu usuario y password por email.</p>
            <a href={exito.linkMoneyPool} target="_blank" rel="noreferrer" style={{ display: 'block', padding: 16, background: 'linear-gradient(135deg, #042C53, #0C447C)', color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 700, marginBottom: 12 }}>Pagar ${exito.monto.toLocaleString()} en MoneyPool</a>
            <button onClick={() => setExito(null)} style={{ padding: '10px 20px', background: '#F0F2F5', color: '#666', border: 'none', borderRadius: 10, cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}

      {reglamento && (
        <div onClick={() => setReglamento(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 24, maxWidth: 600, width: '100%', padding: 40, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#042C53', marginBottom: 8 }}>📖 Reglamento</h2>
            <p style={{ color: '#666', marginBottom: 24 }}>Quiniela Mundial 2026</p>

            <h3 style={{ color: '#042C53', fontSize: 18, fontWeight: 800, marginTop: 20, marginBottom: 10 }}>💰 Inscripcion</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '8px 12px', background: '#F8F9FB', borderLeft: '3px solid #042C53', borderRadius: 4, marginBottom: 6, fontSize: 14 }}><b>Costo:</b> $3,000 MXN por quiniela</li>
              <li style={{ padding: '8px 12px', background: '#F8F9FB', borderLeft: '3px solid #042C53', borderRadius: 4, marginBottom: 6, fontSize: 14 }}><b>Quinielas por persona:</b> ilimitadas</li>
              <li style={{ padding: '8px 12px', background: '#F8F9FB', borderLeft: '3px solid #042C53', borderRadius: 4, marginBottom: 6, fontSize: 14 }}><b>Pago:</b> MoneyPool</li>
              <li style={{ padding: '8px 12px', background: '#F8F9FB', borderLeft: '3px solid #042C53', borderRadius: 4, marginBottom: 6, fontSize: 14 }}><b>Cierre:</b> 10 de junio 2026</li>
            </ul>

            <h3 style={{ color: '#042C53', fontSize: 18, fontWeight: 800, marginTop: 20, marginBottom: 10 }}>🎯 Puntuacion</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div style={{ padding: 14, background: '#FAEEDA', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#854F0B' }}>3 pts</div>
                <div style={{ fontSize: 11, color: '#633806', textTransform: 'uppercase', fontWeight: 600 }}>Acertar ganador / empate</div>
              </div>
              <div style={{ padding: 14, background: '#FAEEDA', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#854F0B' }}>5 pts</div>
                <div style={{ fontSize: 11, color: '#633806', textTransform: 'uppercase', fontWeight: 600 }}>Marcador exacto</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>Solo cuenta el resultado al min 90.</p>

            <h3 style={{ color: '#042C53', fontSize: 18, fontWeight: 800, marginTop: 20, marginBottom: 10 }}>🏆 Premios</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '8px 12px', background: '#F8F9FB', borderLeft: '3px solid #042C53', borderRadius: 4, marginBottom: 6, fontSize: 14 }}><b>1er lugar:</b> 56% de la bolsa</li>
              <li style={{ padding: '8px 12px', background: '#F8F9FB', borderLeft: '3px solid #042C53', borderRadius: 4, marginBottom: 6, fontSize: 14 }}><b>2do lugar:</b> 23% de la bolsa</li>
              <li style={{ padding: '8px 12px', background: '#F8F9FB', borderLeft: '3px solid #042C53', borderRadius: 4, marginBottom: 6, fontSize: 14 }}><b>3er lugar:</b> 14% de la bolsa</li>
              <li style={{ padding: '8px 12px', background: '#F8F9FB', borderLeft: '3px solid #042C53', borderRadius: 4, marginBottom: 6, fontSize: 14 }}><b>Comision organizador:</b> 7%</li>
            </ul>

            <h3 style={{ color: '#042C53', fontSize: 18, fontWeight: 800, marginTop: 20, marginBottom: 10 }}>⚖️ Empates</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ padding: '8px 12px', background: '#F8F9FB', borderLeft: '3px solid #042C53', borderRadius: 4, marginBottom: 6, fontSize: 14 }}>1. Mas marcadores exactos</li>
              <li style={{ padding: '8px 12px', background: '#F8F9FB', borderLeft: '3px solid #042C53', borderRadius: 4, marginBottom: 6, fontSize: 14 }}>2. Mas aciertos en eliminatorias</li>
              <li style={{ padding: '8px 12px', background: '#F8F9FB', borderLeft: '3px solid #042C53', borderRadius: 4, marginBottom: 6, fontSize: 14 }}>3. Reparto en partes iguales</li>
            </ul>

            <button onClick={() => setReglamento(false)} style={{ marginTop: 24, width: '100%', padding: 14, background: '#042C53', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>Cerrar</button>
          </div>
        </div>
      )}

      <footer style={{ background: 'linear-gradient(135deg, #042C53, #0C447C)', color: 'white', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontWeight: 700 }}>⚽ Quiniela Mundial 2026</div>
        <p style={{ fontSize: 11, opacity: 0.5, marginTop: 12 }}>Sitio no afiliado a la FIFA. Quiniela privada.</p>
      </footer>
    </div>
  );
}
