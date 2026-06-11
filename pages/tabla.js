import { useState, useEffect } from 'react';
import { COLORS, SPONSOR } from '../lib/brand';

export default function TablaLideres() {
  const [ranking, setRanking] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [usernameLogueado, setUsernameLogueado] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    try {
      const sesion = sessionStorage.getItem('quiniela_sesion');
      if (sesion) {
        const u = JSON.parse(sesion);
        if (u && u.usuario) setUsernameLogueado(u.usuario.toLowerCase());
      }
    } catch (e) {}
    return () => window.removeEventListener('resize', check);
  }, []);

  async function cargar() {
    try {
      const r = await fetch('/api/tabla');
      const d = await r.json();
      if (d.exito) setRanking(d.ranking);
    } catch (e) { console.error(e); }
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtrado = ranking.filter(q =>
    q.nombreQuiniela.toLowerCase().includes(busqueda.toLowerCase()) ||
    q.nombreUsuario.toLowerCase().includes(busqueda.toLowerCase())
  );

  function colorPosicion(pos) {
    if (pos === 1) return { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', text: 'white', emoji: '🥇' };
    if (pos === 2) return { bg: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', text: 'white', emoji: '🥈' };
    if (pos === 3) return { bg: 'linear-gradient(135deg, #CD7F32, #A0522D)', text: 'white', emoji: '🥉' };
    return { bg: '#F0F2F5', text: '#666', emoji: '' };
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: COLORS.fondoNeutro, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />

      <header style={{ background: `linear-gradient(135deg, ${COLORS.primario}, ${COLORS.primarioOscuro})`, color: 'white', padding: isMobile ? '14px 14px' : '24px 30px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: isMobile ? 8 : 12 }}>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: 8, textDecoration: 'none', flexShrink: 0 }}>
              <img src={SPONSOR.logo} alt={SPONSOR.nombre} style={{ height: isMobile ? 38 : 48, width: 'auto', display: 'block' }} />
            </a>
            <a href="/jugar" style={{ color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? 12 : 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>← {isMobile ? 'Quinielas' : 'Volver a mis quinielas'}</a>
            {usernameLogueado && (
              <a href="/entradas" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>🎟️ {isMobile ? '' : 'Entradas'}</a>
            )}
            <button onClick={cargar} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>🔄</button>
          </div>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, margin: 0 }}>🏆 Tabla de Líderes</h1>
          <p style={{ fontSize: isMobile ? 11 : 13, color: 'rgba(255,255,255,0.9)', margin: '4px 0 0 0' }}>
            {ranking.length} quinielas activas · Actualización cada 30s
          </p>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? 12 : 24, flex: 1, width: '100%', boxSizing: 'border-box' }}>

        <input
          type="text"
          placeholder="🔍 Buscar por nombre de quiniela o jugador..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          style={{ width: '100%', padding: 14, border: '1px solid #E0E0E0', borderRadius: 12, fontSize: 14, marginBottom: 20, boxSizing: 'border-box' }}
        />

        <div style={{ background: 'white', padding: 16, borderRadius: 12, marginBottom: 16, border: '1px solid #E0E0E0' }}>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>Sistema de puntos</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#444' }}>
            <span>🎯 <b>5 pts</b> marcador exacto</span>
            <span>✓ <b>3 pts</b> ganador o empate acertado</span>
          </div>
        </div>

        {cargando ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Cargando ranking...</div>
        ) : filtrado.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#888', background: 'white', borderRadius: 14 }}>
            {busqueda ? 'Sin resultados para tu búsqueda' : 'Aún no hay quinielas activas'}
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: '1px solid #E0E0E0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '44px 1fr 50px 46px 46px' : '60px 1fr 80px 70px 70px', padding: isMobile ? '10px 10px' : '12px 16px', background: COLORS.fondoNeutro, fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', borderBottom: '1px solid #E0E0E0' }}>
              <div style={{ textAlign: 'center' }}>Pos</div>
              <div>Quiniela</div>
              <div style={{ textAlign: 'center' }}>Pts</div>
              <div style={{ textAlign: 'center' }}>🎯 5pts</div>
              <div style={{ textAlign: 'center' }}>✓ 3pts</div>
            </div>

            {filtrado.map(q => {
              const colores = colorPosicion(q.posicion);
              const esMio = usernameLogueado && q.nombreUsuario && q.nombreUsuario.toLowerCase() === usernameLogueado;
              return (
                <div key={q.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '44px 1fr 50px 46px 46px' : '60px 1fr 80px 70px 70px', padding: isMobile ? '12px 10px' : '14px 16px', borderBottom: '1px solid #F0F2F5', alignItems: 'center', background: esMio ? '#FFF9E6' : 'transparent', borderLeft: esMio ? `4px solid ${COLORS.dorado}` : '4px solid transparent' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: isMobile ? 30 : 36, height: isMobile ? 30 : 36, borderRadius: '50%', background: colores.bg, color: colores.text, fontWeight: 800, fontSize: isMobile ? 11 : 13 }}>
                      {colores.emoji || `#${q.posicion}`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: COLORS.azulDetalle, fontSize: 14 }}>{q.nombreQuiniela}</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 900, color: COLORS.azulDetalle }}>{q.puntos}</div>
                  <div style={{ textAlign: 'center', fontSize: 14, color: COLORS.verdeExito, fontWeight: 700 }}>{q.exactos}</div>
                  <div style={{ textAlign: 'center', fontSize: 14, color: '#666', fontWeight: 600 }}>{q.aciertos}</div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 30, fontSize: 12, color: '#888' }}>
          🏆 Quiniela Estadio Gana
        </div>
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
