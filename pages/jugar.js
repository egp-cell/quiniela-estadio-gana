import { useState, useEffect } from 'react';

export default function Jugar() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [logueado, setLogueado] = useState(null);

  // Auto-login si ya hay sesion guardada
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
      setError('Error de conexion');
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
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#F8F9FB', minHeight: '100vh' }}>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

        <header style={{ background: 'linear-gradient(135deg, #042C53, #0C447C)', color: 'white', padding: '20px 30px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, letterSpacing: 1 }}>HOLA</div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>{logueado.nombre} 👋</h1>
            </div>
            <button onClick={logout} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Salir</button>
          </div>
        </header>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 30 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#042C53', marginBottom: 20 }}>Tus quinielas</h2>

          {logueado.quinielas.length === 0 ? (
            <div style={{ background: 'white', padding: 30, borderRadius: 14, textAlign: 'center', color: '#888' }}>No tienes quinielas activas</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {logueado.quinielas.map(q => (
                <div key={q.id} style={{ background: 'white', padding: 24, borderRadius: 14, border: '1px solid #E0E0E0' }}>
                  <div style={{ fontSize: 11, color: '#888', letterSpacing: 1.5, fontWeight: 600 }}>QUINIELA</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#042C53', marginTop: 4 }}>{q.nombre}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#888' }}>PUNTOS</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#1D9E75' }}>{q.puntos || 0}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#888' }}>POSICION</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#BA7517' }}>{q.posicion ? `#${q.posicion}` : '—'}</div>
                    </div>
                  </div>
                  <button style={{ width: '100%', marginTop: 18, padding: 12, background: '#FAC775', color: '#412402', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>
                    Pronosticar partidos →
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 30, padding: 20, background: '#FFF8E7', borderRadius: 12, border: '1px solid #FAE3A0' }}>
            <div style={{ fontSize: 14, color: '#854F0B' }}>
              <b>📅 Proximamente:</b> El sistema para pronosticar los 104 partidos estara disponible antes del 11 de junio. Por ahora puedes ver tus quinielas y verificar que tu cuenta este activa.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PANTALLA LOGIN
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: 'linear-gradient(135deg, #042C53, #0C447C)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ background: 'white', borderRadius: 24, maxWidth: 420, width: '100%', padding: 40, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: 40 }}>⚽</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#042C53', marginTop: 8 }}>Quiniela Mundial 2026</h1>
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
              style={{ width: '100%', padding: 14, marginTop: 4, border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 15, fontFamily: 'monospace' }}
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
              style={{ width: '100%', padding: 14, marginTop: 4, border: '1.5px solid #E0E0E0', borderRadius: 10, fontSize: 15, fontFamily: 'monospace' }}
            />
          </div>

          {error && (
            <div style={{ padding: 12, background: '#FFE5E5', color: '#C62828', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={cargando} style={{ width: '100%', padding: 16, background: 'linear-gradient(135deg, #FAC775, #EF9F27)', color: '#412402', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            {cargando ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid #F0F2F5' }}>
          <p style={{ fontSize: 13, color: '#666' }}>¿Aun no te inscribes?</p>
          <a href="/" style={{ fontSize: 14, color: '#042C53', fontWeight: 700, textDecoration: 'none' }}>Ir a inscripcion →</a>
        </div>
      </div>
    </div>
  );
}
