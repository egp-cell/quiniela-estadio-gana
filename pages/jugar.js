import { useState, useEffect } from 'react';
import { COLORS, SPONSOR } from '../lib/brand';

const WHATSAPP_ORGANIZADOR = '525569161882';

export default function Jugar() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [logueado, setLogueado] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-login si ya hay sesión guardada
  useEffect(() => {
    const sesion = sessionStorage.getItem('quiniela_sesion');
    if (sesion) {
      try {
        setLogueado(JSON.parse(sesion));
      } catch (e) {}
    }
  }, []);

  async function login(e) {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      });
      const data = await res.json();

      if (data.exito) {
        sessionStorage.setItem('quiniela_sesion', JSON.stringify(data.usuario));
        setLogueado(data.usuario);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error de conexión');
    }
    setCargando(false);
  }

  function logout() {
    sessionStorage.removeItem('quiniela_sesion');
    setLogueado(null);
    setUsuario('');
    setPassword('');
  }

  // PANTALLA LOGUEADO
  if (logueado) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: COLORS.fondoNeutro, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

        <header style={{ background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', padding: '20px 30px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: 8, textDecoration: 'none', flexShrink: 0 }}>
              <img src={SPONSOR.logo} alt={SPONSOR.nombre} style={{ height: isMobile ? 38 : 48, width: 'auto', display: 'block' }} />
            </a>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, opacity: 0.85, letterSpacing: 1 }}>HOLA</div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>{logueado.nombre} 👋</h1>
            </div>
           <a href="/tabla" style={{ padding: '8px 16px', background: COLORS.acentoCTA, color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13, marginRight: 8 }}>🏆 Tabla</a>
           <button onClick={logout} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Salir</button>
          </div>
        </header>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 30, flex: 1, width: '100%', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.azulDetalle, marginBottom: 20 }}>Tus quinielas</h2>

          {logueado.quinielas.length === 0 ? (
            <div style={{ background: 'white', padding: 30, borderRadius: 14, textAlign: 'center', color: '#888' }}>No tienes quinielas activas</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {logueado.quinielas.map(q => (
                <div key={q.id} style={{ background: 'white', padding: 24, borderRadius: 14, border: '1px solid #E0E0E0' }}>
                  <div style={{ fontSize: 11, color: '#888', letterSpacing: 1.5, fontWeight: 600 }}>QUINIELA</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.azulDetalle, marginTop: 4 }}>{q.nombre}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#888' }}>PUNTOS</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.verdeExito }}>{q.puntos || 0}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#888' }}>POSICIÓN</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.azulDetalle }}>{q.posicion ? `#${q.posicion}` : '—'}</div>
                    </div>
                  </div>
                 <a href={`/quiniela/${q.id}`} style={{ display: 'block', width: '100%', marginTop: 18, padding: 12, background: COLORS.acentoCTA, color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
                    Pronosticar partidos →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer style={{ background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'white', padding: 16, borderRadius: 16, marginBottom: 16 }}>
            <img src={SPONSOR.logo} alt={SPONSOR.nombre} style={{ height: 60, width: 'auto', display: 'block' }} />
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 6 }}>Patrocinador oficial · {SPONSOR.nombre}</div>
          <div style={{ fontWeight: 700 }}>⚽ Quiniela Estadio Gana</div>
        </footer>
      </div>
    );
  }

  // PANTALLA LOGIN
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: 'white', borderRadius: 24, maxWidth: 420, width: '100%', padding: 40, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <a href="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
              <img src={SPONSOR.logo} alt={SPONSOR.nombre} style={{ height: 70, width: 'auto', display: 'block', margin: '0 auto 10px' }} />
            </a>
            <div style={{ fontSize: 11, color: '#888', letterSpacing: 2, fontWeight: 700 }}>PATROCINADOR OFICIAL</div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 26, paddingTop: 18, borderTop: '1px solid #F0F2F5' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.azulDetalle }}>Quiniela Estadio Gana</h1>
            <p style={{ color: '#666', fontSize: 14, marginTop: 4 }}>Ingresa con tus accesos</p>
          </div>

          <form onSubmit={login}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Usuario</label>
              <input
                required
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                placeholder="Tu usuario"
                style={{ width: '100%', padding: 14, marginTop: 4, border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 15, fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#666', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tu password"
                style={{ width: '100%', padding: 14, marginTop: 4, border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 15, fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>

            {error && (
              <div style={{ padding: 12, background: '#FFE5E5', color: '#C62828', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={cargando} style={{ width: '100%', padding: 16, background: `linear-gradient(135deg, ${COLORS.acentoCTA}, ${COLORS.acentoCTAOscuro})`, color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              {cargando ? 'Entrando...' : 'Entrar →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid #F0F2F5' }}>
            <p style={{ fontSize: 13, color: '#666' }}>¿Aún no te inscribes?</p>
            <a href="/" style={{ fontSize: 14, color: COLORS.primario, fontWeight: 700, textDecoration: 'none' }}>Ir a inscripción →</a>
          </div>
        </div>
      </div>

      <footer style={{ color: 'rgba(255,255,255,0.85)', padding: '20px', textAlign: 'center', fontSize: 12 }}>
        Patrocinador oficial · {SPONSOR.nombre} · ⚽ Quiniela Estadio Gana
      </footer>
    </div>
  );
}
